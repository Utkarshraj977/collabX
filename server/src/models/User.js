import mongoose from 'mongoose';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,   
    lowercase: true,
  }, 

  passwordHash: {
    type: String,
    required: true, 
  },

  avatarUrl: {
    type: String,
  },

  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  refreshtoken:{
    type:String
  },
  lastLoginAt: {
    type: Date,
  } 
}, { timestamps: true });

userSchema.pre('save',async function () {
   if(!this.isModified("passwordHash")){
     return;
   }
   const salt= await bcrypt.genSalt(10);
   this.passwordHash=await bcrypt.hash(this.passwordHash,salt);
   
});

userSchema.methods.comparePassword= async function (pass){
     return await bcrypt.compare(pass,this.passwordHash);
}

userSchema.methods.generateAccessToken=function(){
   return jwt.sign(
    {
      _id: this._id,
      email:this.email,
      name:this.name
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
   )
}

userSchema.methods.generateRefreshToken=function(){
  return jwt.sign(
    {
      _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export default mongoose.model('User', userSchema);
