## Library Usage

### Configuration

Environment Configuration:
```javascript
import Config, { Environment } from 'notification-lib/services/config';

Config.setupConfig(Environment.DEV);
```

Providing custom configuration:
```javascript
import Config, { Environment, Network, ConfigValues } from 'notification-lib/services/config';

const config: ConfigValues = {
  NETWORK: Network.FUJI,
  JSON_RPC_URL: 'https://api.avax-test.network/ext/bc/C/rpc',
  GRAPH_NOTIFICATIONS_URL: 'https://api.thegraph.com/subgraphs/name/notifications',
  EARLYSTAGE_MANAGER_CONTRACT: '0x7f4f8e8f3b3d6b5f4f3f3f3f3f3f3f3f3f3f3f3f',
};

setupConfig(Environment.LOCAL, config);


// or simply:
Config.setupConfig(Environment.LOCAL, {
    NETWORK: Network.FUJI,
    JSON_RPC_URL: 'https://api.avax-test.network/ext/bc/C/rpc',
    GRAPH_NOTIFICATIONS_URL: 'https://api.thegraph.com/subgraphs/name/notifications',
    EARLYSTAGE_MANAGER_CONTRACT: '0x7f4f8e8f3b3d6b5f4f3f3f3f3f3f3f3f3f3f3f3f',
  }
);
```

### Notification Service

Get account notifications:
```javascript
import { NotificationService } from 'notification-lib';

const notificationService = new NotificationService();
const notifications = await notificationService.getAccountNotifications(account);
```

## Available Scripts

In the project directory, you can run:
```
npm start
```

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.
```
npm run build

```

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
```
npm run lint
```

Runs the linter to check for any linting errors.
