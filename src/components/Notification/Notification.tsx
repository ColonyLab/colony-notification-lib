import React, { ReactElement, useEffect, useState } from 'react';
import { getAllNotifications, getAccountNotifications } from '../../services/notification-service';
import EarlyStageService from '../../services/early-stage-service';

import '../../App.css';

export function Notification(): ReactElement {
  useEffect(() => {
    // Retrieve data from localStorage when the component mounts
    // const storedData = LocalStorage.getItem('myDataKey');
    // if (storedData) {
    //     setData(storedData);
    // }
  }, []);

  const allNotifications = async () => {
    await getAllNotifications(1000);
  };

  const [account, setAccount] = useState('');
  const accountNotifications = async () => {
    // const account = "0xa5990f7b9f4600e201a9b73db4779c5b444aad2c";
    await getAccountNotifications(account);
  };

  const isAccountInvolved = async () => {
    const projectNest = "0xa5990f7b9f4600e201a9b73db4779c5b444aad2c";
    const account = "0xa5990f7b9f4600e201a9b73db4779c5b444aad2c";

    await EarlyStageService.isAccountInvolved(projectNest, account);
  };

  return (
    <div>
      <h2>Notifications</h2>
      <button className="big-button" onClick={ allNotifications }>
        Notifications
      </button>

      <h2>Account Notifications</h2>
      <button className="big-button" onClick={ accountNotifications }>
        Account Notifications
      </button>
      <br />
      <input
        value={account}
        onChange={e => setAccount(e.target.value)}
        name="account"
      />


      <h2>EarlyStageManager</h2>
      <button className="big-button" onClick={ isAccountInvolved }>
        isAccountInvolvedInNest
      </button>
    </div>
  );
}
