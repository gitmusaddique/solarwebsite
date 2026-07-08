import sharp from 'sharp';
import fs from 'fs';

async function run() {
  const source = 'public/images/logo.png';
  
  // Extract the circular sun/solar/leaf icon from "O" in SOLAR (perfect 185x185 square)
  const squareIcon = sharp(source)
    .extract({ left: 120, top: 175, width: 185, height: 185 });

  // Save as high-quality PNGs
  await squareIcon.clone().resize(32, 32).toFile('public/favicon-32.png');
  await squareIcon.clone().resize(192, 192).toFile('public/favicon-192.png');
  await squareIcon.clone().resize(512, 512).toFile('public/favicon-512.png');
  
  // Create the main favicon.png (standard 48x48)
  await squareIcon.clone().resize(48, 48).toFile('public/favicon.png');
  await squareIcon.clone().resize(180, 180).toFile('public/apple-touch-icon.png');

  // Let's copy the 32x32 favicon to favicon.ico as a fallback
  const fav32 = await squareIcon.clone().resize(32, 32).png().toBuffer();
  fs.writeFileSync('public/favicon.ico', fav32);
  
  // Also let's create a base64 inline favicon.svg for SVG support
  const base64Png = (await squareIcon.clone().resize(128, 128).png().toBuffer()).toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <image width="128" height="128" href="data:image/png;base64,${base64Png}" />
</svg>`;
  fs.writeFileSync('public/favicon.svg', svgContent);

  console.log("All favicons generated successfully!");
}

run().catch(console.error);
