export const parseTokenMarketCapHistoryAPIResponse = (response) => {
    // Access the list of trades
    const trades = response.Solana.DEXTradeByTokens;
  
    // Map each trade to the desired format
    const result = trades.map(trade => ({
      market_cap: trade.Trade.PriceInUSD * 1_000_000_000,           //Assuming the token quantity is 1B
      time: formatTimestamp(trade.Block.Time)
    }));
  
    return result;
  }



  function formatTimestamp(isoTimestamp: string) {
    const date = new Date(isoTimestamp); // Convert ISO string to Date object
    const now = new Date(); // Get the current time
  
    // Ensure `date` is a valid Date object
    if (isNaN(date.getTime())) {
      throw new Error("Invalid ISO timestamp provided.");
    }
  
    // Calculate the difference in milliseconds
    const diffInMs = now.getTime() - date.getTime(); // Convert both to timestamps
  
    // Format to "hh:mm dd-mm-yyyy"
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    const formattedDate = `${hours}:${minutes} ${day}-${month}-${year}`;
  
    // Calculate "x hours x minutes x seconds ago"
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const remainingMinutes = diffInMinutes % 60;
    const remainingSeconds = diffInSeconds % 60;
    const timeAgo = `${diffInHours} hours ${remainingMinutes} minutes ${remainingSeconds} seconds ago`;
  
    // Return the formatted data
    return {
      formattedDate,
      timeAgo,
      timeAgoInMinutes: diffInMinutes
    };
  }
  

  