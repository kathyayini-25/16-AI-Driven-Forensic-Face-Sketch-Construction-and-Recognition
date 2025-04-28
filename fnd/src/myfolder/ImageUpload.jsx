// import React, { useCallback, useState } from 'react';
// import { useDropzone } from 'react-dropzone';
// import axios from 'axios';
// import ClipLoader from "react-spinners/ClipLoader";


// const ImageUpload = () => {
//     const [file, setFile] = useState(null);
//     const [preview, setPreview] = useState(null);
//     const [result, setResult] = useState([]);
//     const [IsLoading, setIsLoading] = useState(false);

//     const onDrop = useCallback(acceptedFiles => {
//         const uploadedFile = acceptedFiles[0];
//         setFile(uploadedFile);
//         setPreview(URL.createObjectURL(uploadedFile));
//     }, []);

//     const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
//         onDrop, 
//         accept: 'image/*' 
//     });

//     const handleSubmit = async () => {

//         try {
//             setIsLoading(true);
//             const formData = new FormData();
//             formData.append('digitalImage', file);

//             const response = await axios.post('http://localhost:8000/image/upload', formData, {
//                 headers: { 'Content-Type': 'multipart/form-data' }
//             });
//             console.log("response",response);
//             if (response?.data) {
//                 setResult(response?.data?.result);
//             }
//         } catch (error) {
//             console.error("Upload Error:", error);
//         }finally{
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className=" w-full mx-auto p-8 bg-gray-100 rounded-lg shadow-lg">
//             <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">Image Upload & Similar Image Finder</h1>
            
//             <div className=' max-w-4xl w-full mx-auto'>
//                 <div {...getRootProps()} 
//                     className="flex flex-col justify-center items-center w-full border-4 border-dashed border-gray-400 p-10 text-center rounded-lg cursor-pointer hover:border-blue-500 transition duration-300 bg-white shadow-md">
//                     <input {...getInputProps()} />
//                     {isDragActive ? (
//                         <p className="text-blue-500 font-medium">Drop the files here ...</p>
//                     ) : (
//                         <div className="flex flex-col items-center justify-center gap-2">
//                             <p className="text-gray-600 font-medium">Drag & drop an image here, or click to select one</p>
//                             <span className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300 text-lg font-semibold">
//                                 Upload Image
//                             </span>
//                         </div>
//                     )}
//                 </div>
//                 {preview && (
//                     <div className="mt-6 w-full flex flex-col items-center bg-white p-6 rounded-lg shadow-md">
//                         <img src={preview} alt="Uploaded Preview" className=" w-full h-full object-cover rounded-lg shadow-md" />
//                         <button 
//                             className="mt-4 px-8 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition duration-300 text-lg font-semibold" 
//                             onClick={handleSubmit}
//                         >
//                             {IsLoading ? (
//                                 <ClipLoader
//                                 size={24}
//                                 color={"#123abc"}
//                                 loading={IsLoading}
//                                 speedMultiplier={1.5}
//                                 aria-label="Loading Spinner"
//                                 data-testid="loader"
//                             />
//                             ):"Submit"}
//                         </button>
//                     </div>
//                 )}
//             </div>


//             {result.length > 0 && (
//                 <div className="mt-8 w-full">
//                     <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">Similar Images</h2>
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                         {result.map((image, index) => (
//                             <div key={index} className="bg-white p-4 rounded-lg shadow-md text-center">
//                                 <img 
//                                     src={image.url || 'https://via.placeholder.com/300'} 
//                                     alt={`Image ${index}`} 
//                                     className="w-full h-80 object-cover rounded-lg shadow-md"
//                                 />
//                                 <div className="mt-4">
//                                     {/* <p className=''>{image.url}</p> */}
//                                     <p className="text-lg font-semibold text-gray-800">ID: {image.id}</p>
//                                     <p className="text-gray-600">Similarity: {(image.similarity * 100).toFixed(2)}%</p>
//                                     {image.offense && <p className="text-red-600 font-medium">Offense: {image.offense}</p>}
//                                     {image.mittimus && <p className="text-gray-500">Mittimus: {image.mittimus}</p>}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ImageUpload;


import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import ClipLoader from 'react-spinners/ClipLoader';

const ImageUpload = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const onDrop = useCallback(acceptedFiles => {
        const uploadedFile = acceptedFiles[0];
        setFile(uploadedFile);
        setPreview(URL.createObjectURL(uploadedFile));
        setGeneratedImage(null); // Reset previous result
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop, 
        accept: 'image/*' 
    });

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            const formData = new FormData();
            formData.append('digitalImage', file);

            const response = await axios.post('http://localhost:5003/image/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('Response:', response);
            if (response?.data?.result?.generatedImage) {
                setGeneratedImage(response.data.result.generatedImage);
            } else {
                throw new Error('No generated image in response');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            alert(`Error: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full mx-auto p-8 bg-gray-100 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">Sketch to Photo Converter</h1>
            
            <div className="max-w-4xl w-full mx-auto">
                <div {...getRootProps()} 
                    className="flex flex-col justify-center items-center w-full border-4 border-dashed border-gray-400 p-10 text-center rounded-lg cursor-pointer hover:border-blue-500 transition duration-300 bg-white shadow-md">
                    <input {...getInputProps()} />
                    {isDragActive ? (
                        <p className="text-blue-500 font-medium">Drop the sketch here ...</p>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2">
                            <p className="text-gray-600 font-medium">Drag & drop a sketch image here, or click to select one</p>
                            <span className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300 text-lg font-semibold">
                                Upload Sketch
                            </span>
                        </div>
                    )}
                </div>
                {preview && (
                    <div className="mt-6 w-full flex flex-col items-center bg-white p-6 rounded-lg shadow-md">
                        <img src={preview} alt="Sketch Preview" className="max-w-md h-auto object-cover rounded-lg shadow-md" />
                        <button 
                            className="mt-4 px-8 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition duration-300 text-lg font-semibold" 
                            onClick={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ClipLoader
                                    size={24}
                                    color="#ffffff"
                                    loading={isLoading}
                                    speedMultiplier={1.5}
                                    aria-label="Loading Spinner"
                                    data-testid="loader"
                                />
                            ) : 'Generate Photo'}
                        </button>
                    </div>
                )}
            </div>

            {generatedImage && (
                <div className="mt-8 w-full max-w-4xl mx-auto">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">Generated Photo</h2>
                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                        <img 
                            src={generatedImage} 
                            alt="Generated Photo" 
                            className="max-w-md h-auto object-cover rounded-lg shadow-md mx-auto"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
