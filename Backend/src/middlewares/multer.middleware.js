import multer from "multer";

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,`./public/temp`)
    },
    filename: (req,file,cb)=>{
        const path = `${Date.now()}-${file.originalname}`
        cb(null, path)
    }
})

export const upload = multer({storage})