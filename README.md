## Library Usage

### Configuration

Providing custom configuration:
```javascript
import { Config, Network, ConfigValues } from '@colony/colony-notification-lib/lib';

Config.setupConfig({
  NETWORK: Network.FUJI,
  JSON_RPC_URL: 'https://api.avax-test.network/ext/bc/C/rpc',
  GRAPH_NOTIFICATIONS_URL: 'https://api.thegraph.com/subgraphs/name/notifications',
  EARLYSTAGE_MANAGER_CONTRACT: '0x7f4f8e8f3b3d6b5f4f3f3f3f3f3f3f3f3f3f3f3f',
} as ConfigValues);
```

### Notification Service

#### Import
```javascript
import { NotificationService } from '@colony/colony-notification-lib/lib';
```

#### Create notification service:
```javascript
const notificationService = await NotificationService.createInstance();
```

#### Get raw notifications for a specific time range:
```javascript
const notifications = await notificationService.getRawNotifications(fromTimestamp, toTimestamp);
const notifications2 = await notificationService.getRawNotificationsSince(fromTimestamp);
```

#### Get new notifications for account
```javascript
const newNotifications = await notificationService.getAccountNewNotifications(account);
```

#### Get last account notifications wth a limit (allows to load more using the same function):
```javascript
// load newest 5 notifications
const lastNotifications = await notificationService.getAccountLastNotifications(account, 5);

// load next 10 notifications
const nextNotifications = await notificationService.getAccountLastNotifications(account, 10);

// reset last notifications
notificationService.resetAccountLastNotifications(account);
```

#### Set notification timestamp, to mark the time when user has seen the notification:
```javascript
notifications.setNotificationTimestamp(account);
```

## LocalStorage

Allows to have more control over the notifications timestamps:
```javascript
import { LocalStorage } from '@colony/colony-notification-lib/lib';

// get notification timestamp
const timestamp = LocalStorage.getNotificationTimestamp(account);

// set notification timestamp
LocalStorage.setNotificationTimestamp(account, timestamp);

// clear notification timestamp
LocalStorage.clear(account);
```

### Early Stage Service

Early Stage service provide convinient static methods to interact with Early Stage Manager and its Project Nests:
```javascript
import { EarlyStageService } from '@colony/colony-notification-lib/lib';

// checks if project exists in Early Stage Manager
const exist = await EarlyStageService.projectExist(projectNest);

// checks if account is involved in project
const involved = await EarlyStageService.isAccountInvolved(projectNest, account);

// get account allocation in project
const allocation = await EarlyStageService.accountAllocation(projectNest, account);

// get account investment in project
const investment = await EarlyStageService.accountInvestment(projectNest, account);

// get account overinvestment in project
const overinvestment = await EarlyStageService.accountOverinvestment(projectNest, account);
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
