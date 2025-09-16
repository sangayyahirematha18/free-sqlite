import { EventEmitter } from 'events';
class SystemEmitter extends EventEmitter {};
const mEmitter = new SystemEmitter();
export default mEmitter;
