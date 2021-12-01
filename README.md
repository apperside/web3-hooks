# web3-ts-hooks

> A fork of AbsoluteVirtueXI/web3-ts-hooks with fully typed react hooks for web3

[![NPM](https://img.shields.io/npm/v/web3-ts-hooks.svg)](https://www.npmjs.com/package/web3-ts-hooks) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

**This package still need heavy testing.**

**It comes actually in an experimental version.**

**Only works with Metamask actually**

## Install

```bash
yarn add web3-ts-hooks
```

## Usage

First, wrap your app with the top level context provider

```jsx
import { Web3Provider } from 'web3-ts-hooks'

<Web3Provider>
  //rest of your app
</Web3Provider> 
```

Then you can use it everywhere in your app

```jsx
import React, { useContext } from 'react'

import { useContract, useWeb3 } from "web3-ts-hooks";
// myContract.json is the compiled contract in json format
import MyContract from "./myContract.json";

const App = () => {
  const web3 = useWeb3();

  /**
   * this object will contain your contract instance with all of your methods, it uses ethers under the hood.
   * you can use https://www.npmjs.com/package/ethereum-abi-types-generator to generate all the typings 
   * from your contract and use the generated type instead of any
   */
  const contract = useContract<any>(MyContract);
  
  return (
    <>
      <p>Web3: {web3.isWeb3 ? 'injected' : 'no-injected'}</p>
      <p>Network id: {web3.chainId}</p>
      <p>Network name: {web3.networkName}</p>
      <p>MetaMask installed: {web3.isMetaMask ? 'yes' : 'no'}</p>
      <p>logged: {web3.isLogged ? 'yes' : 'no'}</p>
      <p>account: {web3.account}</p>
      <p>Balance: {web3.balance}</p>
      {!web3.isLogged && (
        <>
          <button onClick={web3.login}>login</button>
        </>
      )}
    </>
  )
}
```

## Features

Fully typed

Real time accounts and networks change tracking

Real time ether balance tracking

Simplified use of contract with `useContract` hook

## License

MIT © [Apperside](https://github.com/apperside)

---

This hook is created using [create-react-hook](https://github.com/hermanya/create-react-hook).
