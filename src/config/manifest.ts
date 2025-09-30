// Type imports
import type { ManifestOptions } from "vite-plugin-pwa"
import site from "./site"

/**
 * Defines the configuration for PWA webmanifest.
 */
export const manifest: Partial<ManifestOptions> = {
	name: site.title, 
	short_name: site.shortName, 
	description: site.description,
	theme_color: site.themeColor,
	background_color: site.backgroundColor,
	display: "minimal-ui",
	icons: [
        {
            "src": "../images/oneko-logo.jpg",
            "type": "image/jpg",
            "sizes": "72x72",
            "purpose": "any maskable"
          },
          {
            "src": "../images/oneko-logo.jpg",
            "type": "image/jpg",
            "sizes": "96x96",
            "purpose": "any maskable"
          },
          {
            "src": "../images/oneko-logo.jpg",
            "type": "image/jpg",
            "sizes": "128x128",
            "purpose": "any maskable"
          },
          {
            "src": "../images/oneko-logo.jpg",
            "type": "image/jpg",
            "sizes": "144x144",
            "purpose": "any maskable"
          }
	]
}