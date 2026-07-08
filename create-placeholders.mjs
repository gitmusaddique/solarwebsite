import { writeFileSync, mkdirSync } from 'fs';

const blogImages = [
  { name: 'solar-home-guide.jpg', label: 'Residential Solar Guide', color: '#40F99B' },
  { name: 'pm-surya-ghar.jpg', label: 'PM Surya Ghar Scheme', color: '#9D69A3' },
  { name: 'commercial-solar-roi.jpg', label: 'Commercial Solar ROI', color: '#61707D' },
];

const galleryImages = [
  { dir: 'residential', name: 'home-solar-1.jpg', label: 'Home Solar Install', color: '#40F99B' },
  { dir: 'residential', name: 'home-solar-2.jpg', label: 'Rooftop Solar', color: '#5CF5B3' },
  { dir: 'commercial', name: 'office-solar-1.jpg', label: 'Office Solar', color: '#61707D' },
  { dir: 'commercial', name: 'mall-solar-1.jpg', label: 'Commercial Solar', color: '#8aa1ae' },
  { dir: 'industrial', name: 'factory-solar-1.jpg', label: 'Factory Solar', color: '#9D69A3' },
  { dir: 'industrial', name: 'warehouse-solar-1.jpg', label: 'Industrial Plant', color: '#b882be' },
  { dir: 'agriculture', name: 'farm-solar-1.jpg', label: 'Farm Solar Pump', color: '#14e07a' },
  { dir: 'agriculture', name: 'agri-solar-2.jpg', label: 'Agri Solar', color: '#0ab85f' },
];

function svgPlaceholder(label, color, w=800, h=450) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#0f0f0e"/>
  <rect x="0" y="0" width="${w}" height="${h}" fill="${color}" opacity="0.12"/>
  <circle cx="${w/2}" cy="${h/2-30}" r="48" fill="${color}" opacity="0.3"/>
  <circle cx="${w/2}" cy="${h/2-30}" r="20" fill="${color}" opacity="0.8"/>
  <text x="${w/2}" y="${h/2+40}" font-family="system-ui,sans-serif" font-size="18" font-weight="600" fill="${color}" text-anchor="middle">${label}</text>
  <text x="${w/2}" y="${h/2+65}" font-family="system-ui,sans-serif" font-size="13" fill="#a8a8a4" text-anchor="middle">Solarelites Installation</text>
  <line x1="0" y1="${h-4}" x2="${w}" y2="${h-4}" stroke="${color}" stroke-width="4" opacity="0.6"/>
</svg>`;
}

// Blog images
mkdirSync('public/blog', { recursive: true });
blogImages.forEach(img => {
  writeFileSync(`public/blog/${img.name}`, svgPlaceholder(img.label, img.color));
  console.log(`Created public/blog/${img.name}`);
});

// Gallery images
galleryImages.forEach(img => {
  mkdirSync(`public/gallery/${img.dir}`, { recursive: true });
  writeFileSync(`public/gallery/${img.dir}/${img.name}`, svgPlaceholder(img.label, img.color, 600, 400));
  console.log(`Created public/gallery/${img.dir}/${img.name}`);
});

console.log('All placeholder images created!');
