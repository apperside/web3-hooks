// export Web3 provider
// export useWeb3()

import React, { Reducer, useCallback, useContext, useEffect, useReducer } from 'react'
import { BigNumber, ethers } from 'ethers';

import {
  isWeb3,
  isMetaMask,
  getAccounts,
  loginToMetaMask,
  chainIdtoName
} from './web3-utils'

export type Web3State = {
  isWeb3: boolean,
  isLogged: boolean,
  isMetaMask: boolean,
  account: string,
  balance: number,
  chainId: number,
  networkName: string & "unknown",
  eth_balance: BigNumber,
  signer?: ethers.providers.JsonRpcSigner,
  provider?: ethers.providers.Web3Provider
  providerUrls: string[],
  currentBlock: number,
  balanceBlock: number
}
// web3 reducer
const web3Reducer = (state: Web3State, action: any) => {
  switch (action.type) {
    case 'SET_currentBlock':
      console.log('SET_currentBlock ', action.currentBlock)
      return { ...state, currentBlock: action.currentBlock }
    case 'SET_isWeb3':
      return { ...state, isWeb3: action.isWeb3 }
    case 'SET_isMetaMask':
      return { ...state, isMetaMask: action.isMetaMask }
    case 'SET_isLogged':
      return { ...state, isLogged: action.isLogged }
    case 'SET_account':
      return { ...state, account: action.account }
    case 'SET_provider':
      return {
        ...state,
        provider: action.provider,
        providerUrls: action.providerUrls
      }
    case 'SET_signer':
      return { ...state, signer: action.signer }
    case 'SET_balance':
      console.log('SET_balance ', action.balance)
      return { ...state, balance: action.balance, balanceBlock: action.balanceBlock }
    case 'SET_chainId':
      return { ...state, chainId: action.chainId }
    case 'SET_networkName':
      return { ...state, networkName: action.networkName }
    default:
      throw new Error(`Unhandled action ${action.type} in web3Reducer`)
  }
}

// web3 initial state
const web3InitialState: Web3State = {
  isWeb3: false,
  isLogged: false,
  isMetaMask: false,
  account: ethers.constants.AddressZero,
  balance: 0,
  chainId: 0,
  networkName: 'unknown',
  eth_balance: ethers.utils.parseEther('0'),
  providerUrls: [],
  currentBlock: 0,
  balanceBlock: 0,
  provider: undefined
}

type Web3Hook = Web3State & {
  login: () => Promise<void>
  getCurrentBlock: () => number
};

// web3 hook
export const useWeb3Hook = (options?: {
  pollingInterval: number,
  providerUrls: string[],
  balanceUpdateInterval: number
}): Web3Hook => {
  const [web3State, web3Dispatch] = useReducer<Reducer<Web3State, any>>(web3Reducer, web3InitialState)

  // login in to MetaMask manually.
  // TODO: Check for login on other wallet

  function getCurrentBlock() {
    return web3State.currentBlock
  }

  const login = useCallback(async () => {
    try {
      if (web3State.isWeb3 && !web3State.isLogged) {
        const accounts = await loginToMetaMask()
        web3Dispatch({ type: 'SET_account', account: accounts[0] })
        web3Dispatch({ type: 'SET_isLogged', isLogged: true })
      }
    } catch (e) {
      // user rejects the login attempt to MetaMask
      web3Dispatch({ type: 'SET_account', account: web3InitialState.account })
      web3Dispatch({ type: 'SET_isLogged', isLogged: false })
    }
  }, [web3State.isWeb3, web3State.isLogged])

  // Check if web3 is injected
  // TODO: maybe can check on each render (case of user uninstalling metamasl)
  useEffect(() => {

    web3Dispatch({ type: 'SET_isWeb3', isWeb3: isWeb3() })
  }, [])

  // Listen for networks changes events
  useEffect(() => {
    if (web3State.isWeb3) {
      //console.log('network listener called')

      const onChainChanged = async (chainId: string) => {
        const _chainId = parseInt(chainId, 10)
        const _networkName = chainIdtoName(_chainId)
        //console.log('network id changed:', _chainId)
        //console.log('network name changed:', _networkName)
        web3Dispatch({
          type: 'SET_chainId',
          chainId: _chainId
        })
        web3Dispatch({
          type: 'SET_networkName',
          networkName: _networkName
        })
      }
      window?.ethereum.on('chainChanged', onChainChanged)
      return () => window.ethereum?.removeListener('chainChanged', onChainChanged)
    }
  }, [web3State.isWeb3, window?.ethereum])

  // Check if metamask is installed
  useEffect(() => {
    if (web3State.isWeb3) {
      web3Dispatch({ type: 'SET_isMetaMask', isMetaMask: isMetaMask() })
    }
  }, [web3State.isWeb3])

  // check if logged in to metamask and get account
  useEffect(() => {
    (async () => {
      if (web3State.isWeb3) {
        const accounts = await getAccounts()
        if (accounts.length === 0) {
          // If not logged
          web3Dispatch({ type: 'SET_isLogged', isLogged: false })
          web3Dispatch({
            type: 'SET_account',
            account: web3InitialState.account
          })
        } else {
          // Already logged
          web3Dispatch({ type: 'SET_account', account: accounts[0] })
          web3Dispatch({ type: 'SET_isLogged', isLogged: true })
        }
      }
    })()
  }, [web3State.isWeb3])

  // Listen for addresses change event
  useEffect(() => {
    //console.log('account listener called', window.ethereum)
    if (web3State.isWeb3 && window.ethereum) {
      const onAccountsChanged = (accounts: any[]) => {
        //console.log('account changed')
        web3Dispatch({ type: 'SET_account', account: accounts[0] })
      }
      window.ethereum?.on('accountsChanged', onAccountsChanged)
      return () => window.ethereum?.removeListener('accountsChanged', onAccountsChanged)
    }
  }, [web3State.isWeb3, window.ethereum])

  // Connect to provider and signer
  useEffect(() => {
    if (web3State.account !== web3InitialState.account && web3State.provider == undefined) {
      const providers = [];
      if (options !== undefined) {
        for (let _x = 0;_x < options.providerUrls.length;_x++) {
          const url = options.providerUrls[_x];
          if (url.startsWith('ws')) {
            providers.push(new ethers.providers.WebSocketProvider(url));
            console.log('Saving WS provider')
          } else if (url.startsWith('http')) {
            const provider = new ethers.providers.JsonRpcProvider(url)
            provider.pollingInterval = options.pollingInterval;
            providers.push(provider)
            console.log('Saving RPC provider')
          } else {
            throw Error('Wrong url, must be WS(s) or HTTP(s)')
          }
        }
      }
      const baseProvider = new ethers.providers.Web3Provider(window.ethereum)
      if (providers.length === 0) {
        providers.push(baseProvider)
      }
      const provider = new ethers.providers.FallbackProvider(providers, 1);
      web3Dispatch({ type: 'SET_provider', provider: provider, providerUrls: options?.providerUrls })
      const signer = baseProvider.getSigner();
      web3Dispatch({ type: 'SET_signer', signer: signer })
      console.log('Provider set')
    } else {
      web3Dispatch({
        type: 'SET_provider',
        provider: web3State.provider
      })
      web3Dispatch({ type: 'SET_signer', signer: web3State.signer })
    }
  }, [web3State.account, web3State.chainId, web3State.providerUrls, web3State.provider])

  useEffect(() => {
    const { provider } = web3State
    if (provider) {
      const setCurrentBlockAndBalance = async (blockNumber: number) => {
        console.log('setBlockAndBalance: ', blockNumber);
        web3Dispatch({ type: 'SET_currentBlock', currentBlock: blockNumber })
        const updateInterval: number = options?.balanceUpdateInterval ? options.balanceUpdateInterval : 10;
        if (web3State.provider && (blockNumber > web3State.balanceBlock + updateInterval)) {
          console.log('setBalance', blockNumber, web3State.balanceBlock + updateInterval);
          const _balance = await web3State.provider.getBalance(web3State.account)
          const balance = ethers.utils.formatEther(_balance)
          web3Dispatch({ type: 'SET_balance', balance: balance, balanceBlock: blockNumber })
        }
      }
      provider.on('block', setCurrentBlockAndBalance)

      return () => {
        provider.removeListener('block', setCurrentBlockAndBalance)
      }
    }
  }, [web3State.provider, web3State.currentBlock, web3State.balanceBlock])

  // GET netword_name and chainId
  useEffect(() => {
    //console.log('GET NETWORK CALLED');
    (async () => {
      if (web3State.provider) {
        const network = await web3State.provider.getNetwork()
        web3Dispatch({ type: 'SET_chainId', chainId: network.chainId })
        web3Dispatch({
          type: 'SET_networkName',
          networkName: chainIdtoName(network.chainId)
        })
      }
    })()
  }, [web3State.provider])

  return {
    ...web3State,
    login,
    getCurrentBlock
  } as Web3Hook
}

// eslint-disable-next-line no-undef
type UseWeb3Hook = ReturnType<typeof useWeb3Hook>
// Web3 context
// @ts-ignore
export const Web3Context = React.createContext<UseWeb3Hook>(null)

// Web3 provider
export const Web3Provider = ({ children, options }: { children: any, options?: any }) => {
  const web3contextValue = useWeb3Hook(options)
  return (
    <>
      <Web3Context.Provider value={web3contextValue} > {children} </Web3Context.Provider>
    </>
  )
}

export const useWeb3 = () => {
  return useContext(Web3Context)
}
