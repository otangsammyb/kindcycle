import * as icons from 'hugeicons-react';
const keys = Object.keys(icons);
const specific = [
  'Rocket01Icon', 'RocketIcon',
  'Code01Icon', 'CodeIcon',
  'PresentationOnlineIcon', 'PresentationAnalytics01Icon', 'Presentation02Icon',
  'ArtificialIntelligence01Icon', 'ArtificialIntelligence04Icon',
  'CheckmarkBadge01Icon', 'CheckBadge01Icon', 'Tick01Icon',
  'GithubIcon', 'DashboardSquare01Icon', 'DashboardIcon',
  'Settings01Icon', 'Logout01Icon', 'Mail01Icon',
  'ViewIcon', 'ViewOffSlashIcon', 'FloppyDiskIcon', 'ArrowPathIcon', 'AlertCircleIcon'
];
specific.forEach(s => {
  console.log(`${s}: ${keys.includes(s)}`);
});
