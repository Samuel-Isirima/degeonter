import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/DatabaseConnection'; // Assuming you have a Sequelize instance

class Token extends Model {
  public id!: number;
  public name!: string;
  public mint_address!: string;
  public marketcap!: number;
  public age!: number;
  public quantity_bought!: number;
  public sold!: boolean;
  public pnl!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Token.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    mint_address: { type: DataTypes.STRING, allowNull: false },
    marketcap: { type: DataTypes.FLOAT, allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: false },
    quantity_bought: { type: DataTypes.FLOAT, allowNull: false },
    sold: { type: DataTypes.BOOLEAN, defaultValue: false },
    pnl: { type: DataTypes.FLOAT, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'Token',
    timestamps: true
  }
);

export default Token;
