// export Web3 provider
// export useWeb3()
import React, { Reducer, useCallback, useEffect, useReducer } from 'react'
import { BigNumber, ethers } from 'ethers'
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
  provider?: ethers.providers.Web3Provider,
}
// web3 reducer
const web3Reducer = (state: Web3State, action: any) => {
  switch (action.type) {
    case 'SET_isWeb3':
      return { ...state, isWeb3: action.isWeb3 }
    case 'SET_isMetaMask':
      return { ...state, isMetaMask: action.isMetaMask }
    case 'SET_isLogged':
      return { ...state, isLogged: action.isLogged }
    case 'SET_account':
      return { ...state, account: action.account }
    case 'SET_provider':
      return { ...state, provider: action.provider }
    case 'SET_signer':
      return { ...state, signer: action.signer }
    case 'SET_balance':
      return { ...state, balance: action.balance }
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
  eth_balance: ethers.utils.parseEther('0')
}

// web3 hook
export const useWeb3 = (options?: { useWebSocket?: boolean }): Web3State & { login: () => Promise<void> } => {
  const [web3State, web3Dispatch] = useReducer<Reducer<Web3State, any>>(web3Reducer, web3InitialState)

  // login in to MetaMask manually.
  // TODO: Check for login on other wallet
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
    console.log('hooks: isWeb3 called')
    web3Dispatch({ type: 'SET_isWeb3', isWeb3: isWeb3() })
  }, [])

  // Listen for networks changes events
  useEffect(() => {
    if (web3State.isWeb3) {
      console.log('network listener called')

      const onChainChanged = async (chainId: string) => {
        const _chainId = parseInt(chainId, 10)
        const _networkName = chainIdtoName(_chainId)
        console.log('network id changed:', _chainId)
        console.log('network name changed:', _networkName)
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
    console.log('account listener called', window.ethereum)
    if (web3State.isWeb3 && window.ethereum) {
      const onAccountsChanged = (accounts: any[]) => {
        console.log('account changed')
        web3Dispatch({ type: 'SET_account', account: accounts[0] })
      }
      window.ethereum?.on('accountsChanged', onAccountsChanged)
      return () => window.ethereum?.removeListener('accountsChanged', onAccountsChanged)
    }
  }, [web3State.isWeb3, window.ethereum])

  // Connect to provider and signer
  useEffect(() => {
    if (web3State.account !== web3InitialState.account) {
      const provider = options?.useWebSocket ? new ethers.providers.WebSocketProvider(window.ethereum) : new ethers.providers.Web3Provider(window.ethereum)
      web3Dispatch({ type: 'SET_provider', provider: provider })
      const signer = provider.getSigner()
      web3Dispatch({ type: 'SET_signer', signer: signer })
    } else {
      web3Dispatch({
        type: 'SET_provider',
        provider: web3InitialState.provider
      })
      web3Dispatch({ type: 'SET_signer', signer: web3InitialState.signer })
    }
  }, [web3State.account, web3State.chainId])

  // Get ETH amount
  useEffect(() => {
    (async () => {
      console.log('provider:', web3State.provider)
      if (
        web3State.provider &&
        web3State.account !== web3InitialState.account
      ) {
        const _balance = await web3State.provider.getBalance(web3State.account)
        const balance = ethers.utils.formatEther(_balance)
        web3Dispatch({ type: 'SET_balance', balance: balance })
      } else {
        web3Dispatch({
          type: 'SET_balance',
          balance: web3InitialState.balance
        })
      }
    })()
  }, [web3State.provider, web3State.account])

  // Listen for balance change for webState.account
  useEffect(() => {
    const { provider } = web3State
    if (provider) {
      console.log('USEFFECT FOR BALANCE CHANGE')
      console.log('typeof account:', typeof web3State.account)
      console.log('account: ', web3State.account)

      const updateBalance = async () => {
        console.log('NEW BLOCK MINED')
        const _balance = await provider.getBalance(web3State.account)
        const balance = ethers.utils.formatEther(_balance)
        if (web3State.account !== web3InitialState.account) {
          web3Dispatch({ type: 'SET_balance', balance: balance })
        } else {
          web3Dispatch({
            type: 'SET_balance',
            balance: web3InitialState.balance
          })
        }
      }

      provider.on('block', updateBalance)

      return () => {
        provider.removeListener('block', updateBalance)
      }
    }
  }, [web3State.provider, web3State.account])

  // GET netword_name and chainId
  useEffect(() => {
    console.log('GET NETWORK CALLED');
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
    login
  }
}

// eslint-disable-next-line no-undef
type UseWeb3Hook = ReturnType<typeof useWeb3>
// Web3 context
// @ts-ignore
export const Web3Context = React.createContext<UseWeb3Hook>(null)

// Web3 provider
export const Web3Provider = ({ children }: { children: any }) => {
  return (
    <>
      <Web3Context.Provider value={useWeb3()} > {children} </Web3Context.Provider>
    </>
  )
}
