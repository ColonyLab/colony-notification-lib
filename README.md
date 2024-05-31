## Library Usage

### Configuration

Providing custom configuration:
```javascript
import { Config, Network, ConfigValues } from '@colony/colony-notification-lib/lib';

Config.setupConfig({
  NETWORK: Network.FUJI,
  JSON_RPC_URL: 'https://api.avax-test.network/ext/bc/C/rpc',
  GRAPH_NOTIFICATIONS_URL: 'https://api.thegraph.com/subgraphs/colony/notifications',
  GRAPH_EARLYSTAGE_URL: 'https://api.thegraph.com/subgraphs/colony/earlystage',
  GRAPH_STAKING_V3_URL: 'https://api.thegraph.com/subgraphs/colony/staking',
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

#### Create Account Notification Stream

```javascript
const options = {
  pageSize: 4,
  syncInterval: 120, // 2 minutes
}

// create account notifications stream
const notificationStream = notificationService.createStream(account, (notifications) => {
  // hook to handle notifications
  // stream is syncing with the graph and will call the hook with new notifications
}, {
  options
});

// load more notifications
notificationStream.loadMore(); // hook will be called with 4 notifications
notificationStream.loadMore(); // hook will be called with 8 notifications

// reset stream
notificationStream.reset(pageSize?); // optional pageSize parameter

// get total notifications length
const len = notificationStream.getNotificationsLength()

// Call this method when you need to stop the syncing, e.g., when the component unmounts
notificationStream.stopSyncing();
```

#### Unread Notifications

```javascript
// get number of unread notifications
const unreadNum = notificationStream.unreadNotificationsNumber(account);

// mark individual notification as read
notificationStream.markNotificationAsRead(notificationTimestamp);

// mark all notifications as read
notificationStream.markAllNotificationsAsRead();
```

### General Notifications

Allows to get general notifications unrelated to any specific account.
```javascript
import { GeneralNotifications } from '@colony/colony-notification-lib/lib';

const generalNotifications = await GeneralNotifications.createInstance();
```

#### Get general notifications for a specific time range:
```javascript
const notifications = generalNotifications.getNotifications(fromTimestamp, toTimestamp);
const notifications2 = generalNotifications.getRawNotificationsSince(fromTimestamp);

const notifications3 = generalNotifications.getRawNotificationsTo(toTimestamp);
```

#### Manual Sync General Notifications

Check for if there are any new general notifications.
New notifications will be added to the general notifications cache.
```javascript
const result = await generalNotifications.syncNotifications(); // true/false
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
