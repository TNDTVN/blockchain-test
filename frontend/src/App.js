import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './constants';

function App() {
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('');
  // Read RPC URL and PRIVATE KEY from environment variables so they are configured
  // at build / runtime and not entered by the end user in the UI.
  // Use Create React App convention: REACT_APP_RPC_URL and REACT_APP_PRIVATE_KEY
  // Note: CRA only exposes env vars that start with REACT_APP_ to the client bundle.
  const RPC_URL = process.env.REACT_APP_RPC_URL;
  const PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY || '';
  // form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0.01'); // in ETH by default

  // Auto MetaMask-related UI removed — app uses configured RPC/private-key only.

  // connect using a raw private key (no MetaMask). Uses configured RPC and private key.


  const fetchProducts = useCallback(async (c = contract) => {
    if (!c) return;
    try {
      const raw = await c.getAllProducts();
      const parsed = raw.map((p) => ({
        id: p.id.toString(),
        name: p.name,
        description: p.description,
  // price stored as integer representing cents (real currency). Convert to display with 2 decimals.
  price: (Number(p.price.toString()) / 100).toFixed(2),
        creator: p.creator,
        createdAt: p.createdAt ? new Date(Number(p.createdAt) * 1000).toLocaleString() : ''
      }));
      setProducts(parsed);
      setStatus('Products loaded');
    } catch (err) {
      console.error(err);
      setStatus('Failed to load products');
    }
  }, []);

  // listen for ProductAdded events and refresh
  useEffect(() => {
    if (contract) {
      const onProductAdded = (id, creator, prodName, prodPrice) => {
        setStatus(`New product added (id: ${id.toString()})`);
        fetchProducts(contract);
      };
      contract.on && contract.on('ProductAdded', onProductAdded);
      return () => {
        contract.off && contract.off('ProductAdded', onProductAdded);
      };
    }
  }, [contract, fetchProducts]);

  // connect using a raw private key (no MetaMask). Uses configured RPC and private key.
  const connectWithPrivateKey = React.useCallback(async () => {
    if (!RPC_URL || !PRIVATE_KEY) {
      setStatus('RPC or PRIVATE_KEY not configured');
      return;
    }
    try {
      setStatus('Connecting with configured private key...');
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  await wallet.getAddress();
  setSigner(wallet);
      const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
      setContract(c);
      setStatus('Connected with configured private key');
      // fetch products
      await fetchProducts(c);
    } catch (err) {
      console.error(err);
      setStatus('Private-key connection failed');
    }
  }, [RPC_URL, PRIVATE_KEY, fetchProducts]);

  // Auto-connect on load when a private key is configured in env
  React.useEffect(() => {
    if (PRIVATE_KEY) {
      connectWithPrivateKey();
    }
  }, [PRIVATE_KEY, connectWithPrivateKey]);

  async function handleAddProduct(e) {
    e.preventDefault();
    if (!contract || !signer) {
      setStatus('Please connect wallet first');
      return;
    }
    try {
      setStatus('Sending transaction...');
      // price is a real currency value (e.g., 12.34). Convert to cents (integer) before sending to contract.
  const parsed = parseFloat(price);
  if (Number.isNaN(parsed)) throw new Error('Invalid price');
  // send cents as decimal string (e.g. '1234' for 12.34) to avoid BigInt linter issues
  const cents = Math.round(parsed * 100).toString();
  const tx = await contract.addProduct(name, description, cents);
      setStatus('Waiting for confirmation...');
      await tx.wait();
      setStatus('Product added successfully');
      // clear form
      setName('');
      setDescription('');
      setPrice('0.01');
      // refresh
      fetchProducts();
    } catch (err) {
      console.error(err);
      setStatus('Transaction failed');
    }
  }

  return (
    <div className="App">
      <div className="container">
        <header className="app-header">
          <div>
            <div className="title">ProductRegistry — Frontend</div>
            <div className="meta">Contract: {CONTRACT_ADDRESS}</div>
          </div>
          <div className="meta">Auto-connect using configured private key</div>
        </header>

        <div className="status">{status}</div>

        <section className="card">
          <h3 style={{ marginTop: 0 }}>Products</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <button className="btn secondary" onClick={() => fetchProducts()}>Refresh</button>
          </div>

          {products.length === 0 ? (
            <div className="muted">No products found</div>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Price (currency)</th>
                  <th>Creator</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.description}</td>
                    <td>{p.price}</td>
                    <td>{p.creator}</td>
                    <td>{p.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h3 style={{ marginTop: 0 }}>Add Product</h3>
          <form onSubmit={handleAddProduct} style={{ maxWidth: 560 }}>
            <div className="form-row">
              <label className="muted">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="form-row">
              <label className="muted">Description</label>
              <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <div className="form-row">
              <label className="muted">Price (currency)</label>
              <input className="input" value={price} onChange={(e) => setPrice(e.target.value)} required />
              <div className="muted">Enter price in the fiat currency amount (e.g. 12.34). The value will be stored as cents in the contract.</div>
            </div>

            <div>
              <button className="btn" type="submit">Add Product</button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}

export default App;
