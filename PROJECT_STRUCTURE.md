# Project Structure

```
photo/
├── app/
│   ├── layout.tsx         # Root layout, global styles
│   ├── page.tsx           # Main PhotoBooth logic/UI
│   └── globals.css        # App-wide CSS
├── components/
│   ├── theme-provider.tsx # Theme context
│   └── ui/                # UI components (button, card, etc.)
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── public/
│   ├── images/            # Reference images
│   └── ...                # Placeholders, logos
├── styles/                # Additional CSS
├── package.json           # Project metadata & dependencies
├── tailwind.config.ts     # Tailwind CSS config
├── postcss.config.mjs     # PostCSS config
├── tsconfig.json          # TypeScript config
└── README.md              # Project documentation
```
