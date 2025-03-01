import amqp, { Connection, Channel } from "amqplib";

class RabbitMQService {
  private connection: Connection | null = null;
  private channels: Map<string, Promise<Channel>> = new Map();

  async connect(): Promise<void> {
    if (this.connection) return;
    this.connection = await amqp.connect("amqp://localhost");
    console.log("Connected to RabbitMQ");
  }

  async getChannel(queueName: string): Promise<Channel> {
    if (!this.connection) {
      throw new Error("RabbitMQ connection is not initialized");
    }

    // If a channel promise exists, return it
    if (this.channels.has(queueName)) {
      return this.channels.get(queueName)!;
    }

    // Store the channel creation promise to prevent duplicates
    const channelPromise = (async () => {
      const channel = await this.connection!.createChannel();
      await channel.assertQueue(queueName, { durable: true });
      console.log(`Channel created for queue: "${queueName}"`);
      return channel;
    })();

    this.channels.set(queueName, channelPromise);
    return channelPromise;
  }

  async sendToQueue(queueName: string, message: string): Promise<void> {
    const channel = await this.getChannel(queueName);
    channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
    console.log(`Message sent to "${queueName}": ${message}`);
  }

  async consumeQueue(
    queueName: string,
    onMessage: (msg: string) => void
  ): Promise<void> {
    const channel = await this.getChannel(queueName);
    await channel.consume(
      queueName,
      (msg) => {
        if (msg) {
          const messageContent = msg.content.toString();
          console.log(`Received message from ${queueName}: ${messageContent}`);
          onMessage(messageContent);
          channel.ack(msg);
        }
      },
      { noAck: false }
    );
    console.log(`Started consuming messages from "${queueName}"`);
  }

  async close(): Promise<void> {
    for (const [queueName, channelPromise] of this.channels) {
      const channel = await channelPromise;
      await channel.close();
      console.log(`Channel for queue "${queueName}" closed`);
    }
    this.channels.clear();

    if (this.connection) {
      await this.connection.close();
      console.log("Connection to RabbitMQ closed");
      this.connection = null;
    }
  }
}

// Singleton instance
const rabbitMQService = new RabbitMQService();
export default rabbitMQService;

// Example usage of TokenQueueMessageInterface
export interface TokenQueueMessageInterface {
  payload: any;
  blockTime: string;
  devAddress: string;
  tokenMint: string;
  filters: any;
}

// Function to process messages from multiple queues
export const startQueueProcessors = async (
  queueProcessors: { queueName: string; processor: (message: string) => Promise<void> }[]
): Promise<void> => {
  await rabbitMQService.connect(); // Ensure connection is established

  for (const { queueName, processor } of queueProcessors) {
    // Wrap the processor to ensure it waits for the async function to complete
    rabbitMQService.consumeQueue(queueName, async (message: string) => {
      try {
        await processor(message); // Wait for the processor to finish
      } catch (error) {
        console.error(`Error processing message from queue ${queueName}:`, error);
      }
    });
  }
};
