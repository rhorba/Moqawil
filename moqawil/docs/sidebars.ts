import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guide-installation',
        'guide-facturation',
        'guide-devis',
        'guide-declaration',
        'guide-e-facturation',
        'guide-comptable',
      ],
    },
    {
      type: 'category',
      label: 'Articles',
      items: [
        'article-declaration-ca-2026',
        'article-plafond-80000-dh',
        'article-eviter-perte-statut',
      ],
    },
  ],
}

export default sidebars
