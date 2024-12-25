import amqp, { Connection, Channel } from "amqplib";

class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async connect(): Promise<void> {
    if (this.connection) return; // Avoid reconnecting if already connected
    this.connection = await amqp.connect("amqp://localhost");
    this.channel = await this.connection.createChannel();
    console.log("Connected to RabbitMQ");
  }

  async createQueue(queueName: string): Promise<void> {
    if (!this.channel) throw new Error("RabbitMQ channel is not initialized");
    await this.channel.assertQueue(queueName, { durable: true });
    console.log(`Queue "${queueName}" is ready`);
  }

  async sendToQueue(queueName: string, message: string): Promise<void> {
    if (!this.channel) throw new Error("RabbitMQ channel is not initialized");
    this.channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
    console.log(`Message sent to "${queueName}": ${message}`);
  }

  async consumeQueue(
    queueName: string,
    onMessage: (msg: string) => void
  ): Promise<void> {
    if (!this.channel) throw new Error("RabbitMQ channel is not initialized");
    await this.channel.consume(queueName, (msg) => {
      if (msg) {
        const messageContent = msg.content.toString();
        onMessage(messageContent);
        this.channel?.ack(msg);
      }
    });
    console.log(`Consuming messages from "${queueName}"`);
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    console.log("Connection to RabbitMQ closed");
  }
}

export default new RabbitMQService();

export interface NewTokenQueueMessageInterface {
    payload: any;
    blockTime: string;
    devAddress: string;
    tokenMint: any;
  }
  