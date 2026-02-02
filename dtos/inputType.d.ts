/**TIPAGEM DOS INPUTS */
type InputAPIResponse = {
  id: string;
  userId: string;
  name: string;
  email: string;
  password: string;
};
/**TIPAGEM PARA RETORNAR UM ARRAY COM TODOS AS INFOS DO USER */
type InputArrayAPIResponse = {
  userData: InputAPIResponse[];
};
/**TIPAGEM BARRA DE PESQUISA */
type SearchBarAPIResponse = {
  searchBar: string;
};
