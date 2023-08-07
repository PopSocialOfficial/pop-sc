import { ContractFactory } from "ethers";

export interface Accessory {
    contractAddr: string;
    accessoryId: number;
}

export interface ContractDeployStruct {
    factory: ContractFactory;
    name: string;
    symbol: string;
}