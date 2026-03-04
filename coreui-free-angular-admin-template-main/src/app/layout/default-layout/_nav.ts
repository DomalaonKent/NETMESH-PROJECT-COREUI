import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'ORD',
    url: '/',
    icon: 'icon-ord'
  },
  {
    name: 'LEGAL',
    url: '/',
    icon: 'icon-legal'
  },
  {
    name: 'EOD',
    url: '/eod',
    icon: 'icon-eod',
    children: [
      {
        name: 'Licensing',
        url: '/',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Monitoring',
        url: '/',
        icon: 'nav-icon-bullet',
        children: [
          {
            name: 'Validation',
            url: '/connectivity-dashboard',
            icon: 'nav-icon-bullet'
          }
        ]
      },
      {
        name: 'Inspection',
        url: '/',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  {
    name: 'FAD',
    url: '/fad',
    icon: 'icon-fad',
    children: [
      { name: 'HR',             url: '/',                   icon: 'nav-icon-bullet' },
      { name: 'DTR',            url: '/daily-time-record',  icon: 'nav-icon-bullet' },
      { name: 'General Supply', url: '/',                   icon: 'nav-icon-bullet' },
      { name: 'Accounting',     url: '/',                   icon: 'nav-icon-bullet' }
    ]
  }
];