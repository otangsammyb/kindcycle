import * as icons from 'hugeicons-react';
const keys = Object.keys(icons);
const specific = [
  'Building01Icon', 'Building04Icon',
  'UserMultipleIcon', 'UserGroupIcon',
  'Money01Icon', 'Money03Icon',
  'Dashboard01Icon', 'DashboardSquare01Icon', 'Layout01Icon',
  'Settings01Icon', 'Logout01Icon', 'PresentationOnlineIcon'
];
specific.forEach(s => {
  console.log(`${s}: ${keys.includes(s)}`);
});
