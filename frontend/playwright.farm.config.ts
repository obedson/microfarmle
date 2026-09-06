import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e/farm',workers:1,fullyParallel:false,retries:0,reporter:'list',
 use:{actionTimeout:15000,navigationTimeout:30000,baseURL:'http://127.0.0.1:4174',trace:'off',screenshot:'off',video:'off'},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
 webServer:{command:'node scripts/serve-farm-build.mjs',url:'http://127.0.0.1:4174',reuseExistingServer:false,timeout:180000,
 env:{BROWSER:'none',PORT:'4174',REACT_APP_API_URL:'http://127.0.0.1:3002/api'}},
});
