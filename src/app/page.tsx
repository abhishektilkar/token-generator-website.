"use client";

import { useState } from "react";
import { 
  Connection, 
  LAMPORTS_PER_SOL, 
  clusterApiUrl, 
  PublicKey, 
  TransactionSignature, 
  Keypair 
} from "@solana/web3.js";
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo 
} from "@solana/spl-token";
import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-label";

const connection = new Connection(clusterApiUrl('devnet'));
let payer: Keypair;

const AirdropComponent = () => {
  const [airdropSignature, setAirdropSignature] = useState<TransactionSignature | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [minting, setMinting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string>("");
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [tokenAccount, setTokenAccount] = useState<string>("");
  const [mintAmount, setMintAmount] = useState<number>(0);
  const [mintSuccessMessage, setMintSuccessMessage] = useState<string>("");

  // Function to generate a new keypair and set public key
  const generateKeypair = () => {
    const keypair = Keypair.generate();
    setPublicKey(keypair.publicKey.toBase58());
    fetchBalance(keypair.publicKey);
    payer = keypair;
  };

  // Function to request an airdrop of SOL
  const airdrop = async (publicKey: string, amount: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const pubKey = new PublicKey(publicKey);
      const airdropSignature = await connection.requestAirdrop(pubKey, amount);
      
      await connection.confirmTransaction(airdropSignature, "confirmed");

      setAirdropSignature(airdropSignature);
      fetchBalance(pubKey);
    } catch (err) {
      console.error(err);
      setError("Airdrop failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch the balance of the given public key
  const fetchBalance = async (publicKey: PublicKey) => {
    const balance = await connection.getBalance(publicKey);
    setSolBalance(balance / LAMPORTS_PER_SOL);
  };

  // Function to create a new token
  const createToken = async () => {
    // Hardcoded keypair for simplicity (remove if unnecessary)
    const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
    console.log('privateKey', privateKey)
    payer = Keypair.fromSecretKey(Uint8Array.from([9,117,136,189,55,62,209,153,241,233,131,58,202,154,9,250,86,131,148,56,15,133,245,52,62,208,12,162,29,64,211,48,153,58,228,120,26,9,229,78,255,80,162,96,30,247,141,163,50,229,27,93,129,247,143,215,225,238,93,152,167,45,122,41]));
    console.log(payer.publicKey.toBase58())
    const mintAuthority = payer;

    try {
      setMinting(true);
      setError(null);

      const mint = await createMint(
        connection,
        payer,
        mintAuthority.publicKey,
        null,
        9
      );

      setTokenAddress(mint.toBase58());
    } catch (err) {
      console.error(err);
      setError(`Token creation failed. Please try again. ${err}`);
    } finally {
      setMinting(false);
    }
  };

  // Function to create an associated token account
  const createTokenAccount = async () => {
    if (!tokenAddress) {
      setError("Please create a token first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const mint = new PublicKey(tokenAddress);
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        payer.publicKey
      );
      setTokenAccount(tokenAccount.address.toBase58());
    } catch (err) {
      console.error(err);
      setError(`Token account creation failed. Please try again. ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to mint tokens to the associated token account
  const mintTokens = async () => {
    if (!tokenAddress || !tokenAccount) {
      setError("Please create a token and associated account first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMintSuccessMessage(""); // Clear any previous success message

      const mint = new PublicKey(tokenAddress);
      const account = new PublicKey(tokenAccount);

      await mintTo(
        connection,
        payer,
        mint,
        account,
        payer,
        mintAmount * Math.pow(10, 9)
      );

      setMintSuccessMessage(`${mintAmount} tokens minted successfully!`);
    } catch (err) {
      console.error(err);
      setError(`Minting tokens failed. Please try again. ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 space-y-6">
      <h1 className="text-2xl font-bold">Solana Token Creation</h1>
      
      {/* Commented out: Generate New Keypair Button */}
      {/* 
      <Button onClick={generateKeypair} className="w-64">
        Generate New Keypair
      </Button> 
      */}
      
      {/* Commented out: Display Public Key, Airdrop Button, and SOL Balance */}
      {/*
      {publicKey && (
        <>
          <div>
            <Label>Public Key</Label>
            <p className="text-gray-600 break-all">{publicKey}</p>
          </div>
          <Button 
            onClick={handleAirdrop} 
            disabled={loading} 
            className="w-64"
          >
            {loading ? "Airdropping..." : "Request Airdrop"}
          </Button>
          {solBalance !== null && (
            <p className="text-lg">
              Balance: <strong>{solBalance} SOL</strong>
            </p>
          )}
        </>
      )}
      */}
      
      <Button 
        onClick={createToken} 
        disabled={minting || loading} 
        className="w-64"
      >
        {minting ? "Creating Token..." : "Create New Token"}
      </Button>

      {tokenAddress && (
        <>
          <p className="text-green-600">
            Token Address: <strong>{tokenAddress}</strong>
          </p>
          <Button 
            onClick={createTokenAccount} 
            disabled={loading} 
            className="w-64"
          >
            {loading ? "Creating Token Account..." : "Create Token Account"}
          </Button>
          {tokenAccount && (
            <>
              <p className="text-green-600">
                Token Account Address: <strong>{tokenAccount}</strong>
              </p>
              <div className="flex flex-col items-center space-y-2">
                <input
                  type="number"
                  placeholder="Amount to Mint"
                  className="px-4 py-2 border rounded"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(Number(e.target.value))}
                  disabled={loading}
                />
                <Button 
                  onClick={mintTokens} 
                  disabled={loading} 
                  className="w-64"
                >
                  {loading ? "Minting Tokens..." : "Mint Tokens"}
                </Button>
                {mintSuccessMessage && (
                  <p className="text-green-600">
                    {mintSuccessMessage}
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {airdropSignature && (
        <p className="text-green-600">
          Airdrop successful! Transaction Signature: <strong>{airdropSignature}</strong>
        </p>
      )}

      {error && (
        <p className="text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default AirdropComponent;
