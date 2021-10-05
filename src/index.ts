import { Connection, PublicKey } from "@solana/web3.js";
import {
  FeedInfo,
  FeedListProvider,
} from "@gallynaut/switchboard-feed-registry";
import { parseAggregatorAccountData } from "@switchboard-xyz/switchboard-api";
import dotenv from "dotenv";
import Fuse from "fuse.js";
import Long from "long";
import Twitter, { TwitterOptions } from "twitter-lite";

import { createCard } from "./card";
import { cardTimestamp, formatCurrency, tweetTimestamp } from "./utils";

dotenv.config();

async function main(): Promise<void> {
  const connection = new Connection("https://api.mainnet-beta.solana.com"); //https://solana-api.projectserum.com
  const dataFeeds: FeedInfo[] = (await new FeedListProvider().resolve())
    .filterByClusterSlug("mainnet-beta")
    .getList();

  // 2. Set up the Fuse instance
  const fuse = new Fuse(dataFeeds, {
    keys: ["quotePair.symbol", "quotePair.name", "name", "tags"],
  });
  const config: TwitterOptions = {
    consumer_key: process.env.CONSUMER_KEY || "",
    consumer_secret: process.env.CONSUMER_SECRET || "",
    access_token_key: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  };

  const client = new Twitter(config);
  const upload = new Twitter({
    ...config,
    subdomain: "upload",
  });

  async function replyToTweet(tweet: any): Promise<void> {
    // find spam
    const atCount = (tweet.text.match(/@/g) || []).length;
    if (atCount >= 8) {
      return;
    }

    const tweetQuery = tweet.text
      .replace(`@${process.env.TWITTER_USERNAME} `, "")
      .replaceAll(/(?<!w)@([^s]+)/g, "")
      .trim();
    console.log("Keyword:", tweetQuery);

    // // use fuse.js to fuzzy match on the tweet text
    const matches = fuse.search(tweetQuery);

    if (matches === undefined || matches.length == 0) {
      console.log("No matches found for", tweetQuery);
      client.post("statuses/update", {
        status: `No switchboard feed matching the keyword: ${tweetQuery}`,
        in_reply_to_status_id: tweet.id_str,
        auto_populate_reply_metadata: true,
      });
      return;
    }
    const feed = matches[0].item;
    const name = feed.quotePair?.name ? feed.quotePair?.name : feed.name;
    const pk = new PublicKey(feed.feedAddress);
    console.log("Found:", name);

    // parse switchboard account and get latest result for a given feed
    try {
      const aggAcct = await parseAggregatorAccountData(connection, pk);
      let result = aggAcct.currentRoundResult;
      if (!result?.result) {
        result = aggAcct.lastRoundResult;
        if (!result?.result) {
          throw "no result";
        } else {
          console.log("using lastRoundResult");
        }
      }
      // format decimal places of result. If currency append unit icon
      let price = `${result?.result}`;
      price =
        feed.basePair?.symbol === "USD"
          ? `$${formatCurrency(result?.result)}`
          : feed.basePair?.symbol === "SOL"
          ? `◎${formatCurrency(result?.result)}`
          : price;
      console.log("price:", price);
      let ts = 0;
      if (result.roundOpenTimestamp) {
        if (result.roundOpenTimestamp instanceof Long) {
          ts = result.roundOpenTimestamp?.low;
        } else if (typeof result.roundOpenTimestamp === "number") {
          ts = result.roundOpenTimestamp;
        }
      }

      const tweetTs = tweetTimestamp(ts);
      const replyText = `${name}: ${price}\r\nTimestamp: ${tweetTs}\r\nhttps://switchboard.xyz/explorer/1/${feed.feedAddress}`;

      // create image card from feed
      // upload image to twitter then attach image to a tweet
      try {
        const cardTs = cardTimestamp(ts);
        const imgStr = await createCard(name, price, cardTs);
        const media = await upload.post("media/upload", {
          media_data: imgStr,
        });
        console.log("uploaded media, sending tweet");
        await client.post("statuses/update", {
          status: replyText,
          in_reply_to_status_id: tweet.id_str,
          auto_populate_reply_metadata: true,
          media_ids: media.media_id_string,
        });
      } catch (error) {
        console.log("media upload failed, sending tweet without image");
        console.error("error: ", error);
        await client.post("statuses/update", {
          status: replyText,
          in_reply_to_status_id: tweet.id_str,
          auto_populate_reply_metadata: true,
        });
      }
    } catch (error) {
      console.error("failed to parse switchboard account: ", error);
    }
  }

  client
    .stream("statuses/filter", {
      track: `@${process.env.TWITTER_USERNAME}`,
    })
    .on("start", () => console.log("watching tweets..."))
    .on("data", replyToTweet)
    .on("ping", () => console.log("ping"))
    .on("error", (error) => console.log("error", error))
    .on("end", () => console.log("end"));
}

main();
