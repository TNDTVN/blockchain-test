import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ProductRegistryModule", (m) => {
    const registry = m.contract("ProductRegistry");

    return { registry };
});
