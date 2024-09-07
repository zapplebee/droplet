import { Hono } from 'hono'
import type { FC } from 'hono/jsx'
import path from "node:path"
const app = new Hono()


const Layout: FC = (props) => {
  return (
    <html>
      <body>{props.children}</body>
      <h1>Upload an Image</h1>
        <form action="" method="post" enctype="multipart/form-data">
            <label for="pic">Choose an image:</label>
            <input type="file" id="pic" name="pic" accept="image/*" required/>
            <button type="submit">Upload</button>
        </form>
        
    </html>
  )
}

const Top: FC<{ messages: string[] }> = (props: {
  messages: string[]
}) => {
  return (
    <Layout>
      <h1>Hello Hono!</h1>
      <ul>
        {props.messages.map((message) => {
          return <li>{message}!!</li>
        })}
      </ul>
    </Layout>
  )
}

app.get('/', (c) => {
  const messages = ['Good Morning', 'Good Evening', 'Good Night']
  return c.html(<Top messages={messages} />)
})


app.post('/', async (c) => {
  // Parse the multipart form data
  const formData = await c.req.parseBody();
  
  const file: File = formData.pic as File // Access the 'pic' input file

  if (file) {
    const uploadFolder = './uploads'; // Define the upload directory
    const newFilePath = path.join(uploadFolder, file.name); // Final file path



    // Write the uploaded file's buffer to disk using Bun's file system API
    await Bun.write(newFilePath, file.data);

    return c.text(`File uploaded successfully: ${file.name}`);
  }

  return c.text('No file uploaded');
});

export default app
