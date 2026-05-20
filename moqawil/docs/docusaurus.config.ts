import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  title: 'Moqawil — Documentation',
  tagline: 'La conformité auto-entrepreneur, sans effort.',
  favicon: 'img/favicon.ico',

  url: 'https://docs.moqawil.ma',
  baseUrl: '/',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'ar'],
    localeConfigs: {
      fr: { label: 'Français', direction: 'ltr' },
      ar: { label: 'العربية', direction: 'rtl' },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/rhorba/Moqawil/tree/master/moqawil/docs/',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Moqawil',
      items: [
        { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: 'Documentation' },
        {
          href: 'https://github.com/rhorba/Moqawil',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Installation', to: '/guide-installation' },
            { label: 'Facturation', to: '/guide-facturation' },
            { label: 'Déclarations', to: '/guide-declaration' },
          ],
        },
        {
          title: 'Projet',
          items: [
            { label: 'GitHub', href: 'https://github.com/rhorba/Moqawil' },
            { label: 'AGPL-3.0', href: 'https://github.com/rhorba/Moqawil/blob/master/moqawil/LICENSE' },
          ],
        },
      ],
      copyright: `Moqawil — Open source, AGPL-3.0. Construit pour les ~400 000 auto-entrepreneurs marocains.`,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
