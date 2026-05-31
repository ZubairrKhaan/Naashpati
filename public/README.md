# Public Assets Folder Structure

This folder contains all static assets served directly by the web server.

## Folder Structure

```
public/
├── images/                 # All image assets
│   ├── products/          # Product images
│   ├── banners/           # Banner/slider images
│   ├── categories/        # Category images
│   └── testimonials/      # Customer testimonial images
├── icons/                  # All icon assets
│   ├── favicons/          # Different favicon sizes/formats
│   ├── social/            # Social media icons
│   ├── favicon.svg        # Main favicon (moved from root)
│   └── icons.svg          # General icons sprite
└── assets/                 # Other static assets
    ├── logos/             # Company logos, brand assets
    └── documents/         # PDFs, documents, etc.
```

## Usage Guidelines

### Images

- **Products**: Place product images in `images/products/`
- **Banners**: Homepage banners and promotional images in `images/banners/`
- **Categories**: Category icons/images in `images/categories/`
- **Testimonials**: Customer photos/testimonial images in `images/testimonials/`

### Icons

- **Favicons**: Multiple sizes/formats in `icons/favicons/` (16x16.ico, 32x32.ico, etc.)
- **Social**: Social media platform icons in `icons/social/`
- **General**: Reusable icons in `icons/icons.svg`

### Assets

- **Logos**: Company logo variations in `assets/logos/`
- **Documents**: Downloadable PDFs, terms, policies in `assets/documents/`

## File Naming Convention

- Use kebab-case: `product-image.jpg`
- Include size for favicons: `favicon-16x16.ico`
- Use descriptive names: `green-tea-extract.jpg`

## Image Optimization

- Compress images before uploading
- Use WebP format when possible for better performance
- Provide multiple sizes for responsive images
