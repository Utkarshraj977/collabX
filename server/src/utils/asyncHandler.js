const asyncHandler=(handlerfunc)=>{
    return (req,res,next)=>{
        Promise.resolve(handlerfunc(req,res,next))
         .catch((err)=>next(err));
    }
}

export {asyncHandler};
