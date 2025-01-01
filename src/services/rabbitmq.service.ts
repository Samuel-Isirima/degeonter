import amqp, { Connection, Channel } from "amqplib";

class RabbitMQService {
  private connection: Connection | null = null;
  private channels: Map<string, Channel> = new Map();

  // Ensure a single RabbitMQ connection
  async connect(): Promise<void> {
    if (this.connection) return; // Avoid reconnecting if already connected
    this.connection = await amqp.connect("amqp://localhost");
    console.log("Connected to RabbitMQ");
  }

  // Create or reuse a channel for a specific queue
  async getChannel(queueName: string): Promise<Channel> {
    if (!this.connection) {
      throw new Error("RabbitMQ connection is not initialized");
    }

    if (this.channels.has(queueName)) {
      return this.channels.get(queueName)!; // Reuse existing channel
    }

    const channel = await this.connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });
    this.channels.set(queueName, channel);
    console.log(`Channel created for queue: "${queueName}"`);
    return channel;
  }

  // Send a message to a specific queue
  async sendToQueue(queueName: string, message: string): Promise<void> {
    const channel = await this.getChannel(queueName);
    channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
    console.log(`Message sent to "${queueName}": ${message}`);
  }

  // Consume messages from a specific queue
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

  // Close all channels and the connection
  async close(): Promise<void> {
    for (const [queueName, channel] of this.channels) {
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

