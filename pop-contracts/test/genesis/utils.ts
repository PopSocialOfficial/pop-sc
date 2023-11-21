import MerkleTree from 'merkletreejs'
import keccak256 from 'keccak256'

export function generateMerkl (userAddresses: string[]): MerkleTree {
    const elements = userAddresses.map((user) => {
        return keccak256(user)
    })
    return new MerkleTree(elements, keccak256, { sort: true })
}

// export keccak256 = keccak256;