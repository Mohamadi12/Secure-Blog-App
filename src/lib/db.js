import mongoose from "mongoose";

const connectToDatabase = async () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDb is connected successfully"))
    .catch((error) => console.log(error));
};
export default connectToDatabase;