import h5py
import json
import sys

def read_hdf5(file_path):
    with h5py.File(file_path, 'r') as f:
        gene_ids = f['genes'][:]
        person_ids = f['samples'][:]
        expression_matrix = f['pred_expr'][:]
        
        # Decode byte objects to strings if necessary
        if isinstance(gene_ids[0], bytes):
            gene_ids = [x.decode('utf-8') for x in gene_ids]
        if isinstance(person_ids[0], bytes):
            person_ids = [x.decode('utf-8') for x in person_ids]
        
        return {
            'gene_ids': gene_ids,
            'person_ids': person_ids,
            'expression_matrix': expression_matrix.tolist()
        }

if __name__ == "__main__":
    file_path = sys.argv[1]
    data = read_hdf5(file_path)
    print(json.dumps(data))
