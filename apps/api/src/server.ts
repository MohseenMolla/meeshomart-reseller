import mongoose from 'mongoose';
import { app } from './app';
import { config } from './config';
import { startScheduler } from './scheduler';
mongoose.connect(config.mongo).then(()=>{const srv=app.listen(config.port,()=>console.log('API on',config.port));
 const stop=()=>srv.close(()=>mongoose.disconnect().then(()=>process.exit(0)));process.on('SIGTERM',stop);process.on('SIGINT',stop);if(process.env.RUN_JOBS!=='false')return startScheduler();});
