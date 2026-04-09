export interface TareaModel {
  id: number;
  idUsuario: string;
  titulo: string;
  descripcion: string;
  fechaLimite?: string;
  estado: 'pendiente' | 'completada';
}
