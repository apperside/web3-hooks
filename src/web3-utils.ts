window.ethereum = window.ethereum || {}

export const isWeb3 = () => {
  return typeof window.ethereum !== 'undefined'
}

export const isMetaMask = () => {
  return !!window.ethereum.isMetaMask
}

// return account if connected
export const getAccounts = async () => {
  try {
    return await window.ethereum.request({
      method: 'eth_accounts'
    })
  } catch (e) {
    console.error("error in getAccounts", e);
    throw e
  }
}

// login attempt, is succcess return array of account
export const loginToMetaMask = async () => {
  try {
    return await window.ethereum.request({
      method: 'eth_requestAccounts'
    })
  } catch (e) {
    console.error("error in loginToMetaMask", e);
    throw e
  }
}

export const chainIdtoName = (chainId: number) => {
  switch (chainId) {
    case 1:
      return 'Mainnet'
    case 3:
      return 'Ropsten'
    case 4:
      return 'Rinkeby'
    case 42:
      return 'Kovan'
    case 5:
      return 'Goerli'
    default:
      return 'unknown'
  }
}

