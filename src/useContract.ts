import { ethers } from 'ethers'
import { useContext, useMemo } from 'react'
import { Web3Context } from './useWeb3'

export const useContract = <T>({ networks, abi }: any) => {
  const web3State = useContext(Web3Context)
  // const [contract, setContract] = useState<ethers.Contract>()

  const contract = useMemo(() => {
    console.log("[abi, networks, web3State.chainId, web3State.signer] changed", [abi, networks, web3State.chainId, web3State.signer])
    if (web3State?.signer && web3State.chainId && abi) {
      return new ethers.Contract(networks[web3State.chainId]?.address, abi, web3State.signer) as unknown as T
    }
    return undefined;
  }, [abi, networks, web3State.chainId, web3State.signer])
  // useEffect(() => {
  //   console.log("web3State?.signer, networks, abi changed", web3State?.signer, networks, abi)
  //   if (web3State?.signer && web3State.chainId && abi) {
  //     setContract(new ethers.Contract(networks[web3State.chainId]?.address, abi, web3State.signer))
  //   } else {
  //     setContract(undefined)
  //   }
  // }, [web3State?.signer, networks, abi])
  // return contract as unknown as T
  return contract;
}

export const loadContract = <T>(address: string, abi: any, signer: ethers.providers.JsonRpcSigner) => {
  return new ethers.Contract(address, abi, signer) as unknown as T
}
