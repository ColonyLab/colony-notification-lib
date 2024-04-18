import React from 'react';
import './App.css';

import { Notification } from './components/Notification';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Notification /> {/* Use the component */}
      </header>
    </div>
  );
}

export default App;
