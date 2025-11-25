import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAddress } from "viem";

import { network } from "hardhat";

describe("ProductRegistry", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const [deployer] = await viem.getWalletClients();

    it("Should add a product and emit ProductAdded event", async function () {
        const productRegistry = await viem.deployContract("ProductRegistry");

        const name = "Test Product";
        const description = "A test product";
        const price = 100n;

        await viem.assertions.emitWithArgs(
            productRegistry.write.addProduct([name, description, price]),
            productRegistry,
            "ProductAdded",
            [1n, getAddress(deployer.account.address), name, price]
        );
    });

    it("Should get a product by id", async function () {
        const productRegistry = await viem.deployContract("ProductRegistry");

        const name = "Test Product";
        const description = "A test product";
        const price = 100n;

        const tx = await productRegistry.write.addProduct([
            name,
            description,
            price,
        ]);
        const receipt = await publicClient.getTransactionReceipt({ hash: tx });

        const product = await productRegistry.read.getProduct([1n]);
        assert.equal(product[0], 1n); // id
        assert.equal(product[1], name); // name
        assert.equal(product[2], description); // description
        assert.equal(product[3], price); // price
        assert.equal(product[4].toLowerCase(), receipt.from.toLowerCase()); // creator
        // createdAt is block.timestamp, hard to assert exactly
    });

    it("Should revert when getting non-existent product", async function () {
        const productRegistry = await viem.deployContract("ProductRegistry");

        await assert.rejects(
            productRegistry.read.getProduct([999n]),
            /ProductRegistry: product not found/
        );
    });

    it("Should get all product ids", async function () {
        const productRegistry = await viem.deployContract("ProductRegistry");

        await productRegistry.write.addProduct(["Product 1", "Desc 1", 100n]);
        await productRegistry.write.addProduct(["Product 2", "Desc 2", 200n]);

        const ids = await productRegistry.read.getProductIds();
        assert.deepEqual(ids, [1n, 2n]);
    });

    it("Should get all products", async function () {
        const productRegistry = await viem.deployContract("ProductRegistry");

        await productRegistry.write.addProduct(["Product 1", "Desc 1", 100n]);
        await productRegistry.write.addProduct(["Product 2", "Desc 2", 200n]);

        const products = await productRegistry.read.getAllProducts();
        assert.equal(products.length, 2);
        assert.equal(products[0].name, "Product 1");
        assert.equal(products[1].name, "Product 2");
    });
});
