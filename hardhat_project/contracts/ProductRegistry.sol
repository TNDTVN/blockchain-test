// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title ProductRegistry - store basic product info with add & view functions
/// @notice Simple on-chain registry for demos: add products and read single or all products
contract ProductRegistry {
    struct Product {
        uint256 id;
        string name;
        string description;
        uint256 price; // in wei (or you can treat as arbitrary units)
        address creator;
        uint256 createdAt;
    }

    // Auto-incrementing id
    uint256 private nextId = 1;

    // storage
    mapping(uint256 => Product) private products;
    uint256[] private productIds;

    event ProductAdded(
        uint256 indexed id,
        address indexed creator,
        string name,
        uint256 price
    );

    /// @notice Add a new product to the registry
    /// @param _name Product name
    /// @param _description Short description
    /// @param _price Price (any unit; commonly wei if you want to associate value)
    /// @return id The id assigned to the new product
    function addProduct(
        string calldata _name,
        string calldata _description,
        uint256 _price
    ) external returns (uint256 id) {
        id = nextId++;

        Product memory p = Product({
            id: id,
            name: _name,
            description: _description,
            price: _price,
            creator: msg.sender,
            createdAt: block.timestamp
        });

        products[id] = p;
        productIds.push(id);

        emit ProductAdded(id, msg.sender, _name, _price);
        return id;
    }

    /// @notice Get a product by id
    /// @param _id The product id
    /// @return id, name, description, price, creator, createdAt
    function getProduct(
        uint256 _id
    )
        external
        view
        returns (
            uint256,
            string memory,
            string memory,
            uint256,
            address,
            uint256
        )
    {
        Product storage p = products[_id];
        require(p.id != 0, "ProductRegistry: product not found");
        return (p.id, p.name, p.description, p.price, p.creator, p.createdAt);
    }

    /// @notice Get all product ids
    /// @return ids Array of product ids stored
    function getProductIds() external view returns (uint256[] memory) {
        return productIds;
    }

    /// @notice Get all products
    /// @dev Returns an array of Products. Suitable for small registries; for large data sets prefer pagination off-chain.
    function getAllProducts() external view returns (Product[] memory) {
        uint256 len = productIds.length;
        Product[] memory list = new Product[](len);
        for (uint256 i = 0; i < len; i++) {
            list[i] = products[productIds[i]];
        }
        return list;
    }
}
