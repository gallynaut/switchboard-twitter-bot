import { createCanvas, loadImage } from "canvas";

export const createCard = (
  title: string,
  price: string,
  timestamp: string
): Promise<string> => {
  const width = 800;
  const height = 400;
  const fontface = "Roboto";
  // https://yangcha.github.io/iview/iview.html
  const rectLeft = 355;
  const rectRight = 765;
  const rectWidth = rectRight - rectLeft;
  const rectTop = 75;
  const rectBottom = 365;
  const rectHeight = rectBottom - rectTop;
  const maxTitleHeight = 40;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  return loadImage("./assets/CardTemplate.jpg").then((image) => {
    // draw background image
    context.drawImage(image, 0, 0);

    // add title text
    const text = "◎" + title + " ";
    context.font = `bold 30pt ${fontface}`;
    context.textAlign = "center";

    // write text
    context.textBaseline = "top";
    context.fillStyle = "#fff";
    let fontsize = 300;
    // lower the font size until the text fits the rect width
    do {
      fontsize--;
      context.font = "bold" + fontsize + "px " + fontface;
    } while (context.measureText(text).width > rectWidth - 10);
    // lower the font size until the text is below the max height
    do {
      fontsize--;
      context.font = "bold" + fontsize + "px " + fontface;
    } while (
      context.measureText(text).actualBoundingBoxDescent > maxTitleHeight
    );

    // draw the text
    context.fillText(text, 0.7 * width, 0.25 * height);

    const textWidth = context.measureText(text).width;
    const lineBuffer = (rectWidth - textWidth) / 2;
    // const lineWidth = textWidth < 0.8 * rectWidth ?

    // underline the title
    const yLoc =
      rectTop + 2 * context.measureText(text).actualBoundingBoxDescent - 10;
    context.fillRect(rectLeft + lineBuffer, yLoc, textWidth, 2);

    // output the price
    fontsize += 10; // a bit bigger
    context.font = "bold" + fontsize + "px " + fontface;
    context.fillText(price, 0.7 * width, 0.45 * height);

    // output the price
    fontsize -= 15;
    context.font = "bold" + fontsize + "px " + fontface;
    context.fillStyle = "#9a9a9a";
    context.fillText(timestamp, 0.7 * width, 0.85 * height);

    const buffer = canvas.toBuffer("image/png");
    // fs.writeFileSync(`./tmp/${title.replace('/', '-')}.png`, buffer);
    // console.log('wrote image ', title);

    return buffer.toString("base64");
  });
};
