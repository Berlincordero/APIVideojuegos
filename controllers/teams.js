import team from "../db/team.js"
import { validateTeam, validatePartialTeam } from "../schemas/team.js"
import { isValidObjectId } from "mongoose";
import { capitalize } from "../utils/utils.js";
import config from "../config/config.js"
import errorWrapper from "../utils/errorWrapper.js";
import { CustomError } from "../utils/customError.js";




export const getTeams = errorWrapper(async (req, res) => {
    const { name, description, achievements, games} = req.query;

    const fields = {
        name: parseInt(name) === 1,
        description,
        achievements,
        games
    }
    const finalFields = Object.fromEntries(Object.entries(fields).filter(field => field[1]).map(field => [field[0], parseInt(field[1])]));

    const respond = await team.find({}, {
        _id: 0,
        ...finalFields
    });
    

    res.json({
        status: "success",
        data: respond
    });
})

export const getTeam = errorWrapper(async (req, res) => {
    const { id } = req.params;
    let regexName = new RegExp(capitalize(id), "i");        
    const respond = id.length < 24 ? await team.findOne({name: {$regex: regexName}}) : await team.findById(id, {versionKey: 0}); 
    if (!respond) throw new CustomError(JSON.stringify({message: "The document was not found"}), 404, "not found");

    res.json({
        status: "success",
        data: respond
    })
})


export const registerTeam = errorWrapper(async (req, res) => {
    const result = validateTeam(req.body);
    if (result.error) throw new CustomError(result.error.message, 400);
    
    
    const alreadyExist = await team.findOne({name: capitalize(result.data.name)});
    if (alreadyExist) throw new CustomError(JSON.stringify({message: `Resource already exist in the data base, follow the next link to find the data: http://localhost:${config.port}/teams/${alreadyExist._id}`}), 409, "redirect");
      

    const newDocument = await team.create({...result.data})

    res.status(201).json({
        status: "success",
        data: result.data
    })
})

export const deleteTeam = errorWrapper(async (req, res) => {
    const { id } = req.params;
    const alreadyExist = await team.findById(id); 
    if (!alreadyExist) throw new CustomError(JSON.stringify({message: "Cannot delete the requested document"}), 404, "not found");
    
    
    await team.deleteOne(alreadyExist._id);
    return res.status(204).json({
        status: "success",
        message: "The document was deleted succesfully"
    })
})

export const updateTeam = errorWrapper(async (req, res, next) => {
    const { id } = req.params;
    const result = validatePartialTeam(req.body);

    if (result.error) throw new CustomError(result.error.message, 400);
    if (!isValidObjectId(id)) throw new CustomError(JSON.stringify({message: "The id must be a string of 12 bytes or a string of 24 hex characters or an integer"}), 500, "failed")
    
    const alreadyExist = await team.findById(id); 
    if (!alreadyExist) throw new CustomError(JSON.stringify({message: "Not Found"}), 404, "not found")
    
    
    const teamUpdated = await team.updateOne({_id: alreadyExist._id}, {...result.data});
    res.status(200).json({
        staus: "success",
        data: teamUpdated
    })    
})