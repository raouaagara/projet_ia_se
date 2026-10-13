const httpServer = 'C:\\Users\\Lenovo\\AppData\\Roaming\\npm\\node_modules\\http-server\\bin\\http-server';
const distDir    = 'dist/clinique-frontend/browser';

module.exports = {
  apps: [
    {
      name       : 'front',
      script     : httpServer,
      interpreter: 'node',
      args       : `${distDir} -p 4200`,
      cwd        : 'C:\\Users\\Lenovo\\Projects\\clinique-medicale\\frontend',
      watch      : false,
      env        : { NODE_ENV: 'production' }
    },
    {
      name       : 'api',
      script     : httpServer,
      interpreter: 'node',
      args       : `${distDir} -p 4201`,
      cwd        : 'C:\\Users\\Lenovo\\Projects\\clinique-medicale\\frontend',
      watch      : false,
      env        : { NODE_ENV: 'production' }
    },
    {
      name       : 'backoffice',
      script     : httpServer,
      interpreter: 'node',
      args       : `${distDir} -p 4202`,
      cwd        : 'C:\\Users\\Lenovo\\Projects\\clinique-medicale\\frontend',
      watch      : false,
      env        : { NODE_ENV: 'production' }
    }
  ]
};
