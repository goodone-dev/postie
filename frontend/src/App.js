import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PostmanWorkspace from '@/components/postman/PostmanWorkspace';
import { Toaster } from '@/components/ui/sonner';

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<PostmanWorkspace />} />
                    <Route path="*" element={<PostmanWorkspace />} />
                </Routes>
            </BrowserRouter>
            <Toaster />
        </div>
    );
}

export default App;
