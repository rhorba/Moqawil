import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Guides',
      items: ['guide-installation', 'guide-facturation', 'guide-declaration'],
    },
  ],
}

export default sidebars
