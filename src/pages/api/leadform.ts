export const prerender = false; //This will not work without this line

import type { APIRoute, APIContext } from 'astro';

export const POST: APIRoute = async ({ request, locals }: APIContext) => {
    const data = await request.formData();
    const name = data.get("usrname");
    const email = data.get("email");
    const message = data.get("msg");
    const refer = data.get("ref");

    if (!locals || !locals.runtime || !locals.runtime.env || !locals.runtime.env.DB) {
        return new Response(JSON.stringify({ error: 'Database not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { DB } = locals.runtime.env;

    if (!name || !email || !message || !refer) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Call a function to save the email to the D1 database
    const query = 'INSERT INTO leads (name, email, refer, message, timestamp) VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)';
    await DB.prepare(query).bind(name, email, refer, message).run();

    return new Response(JSON.stringify({ message: 'Submitted successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};

// export const prerender = false;

// import type { APIRoute, APIContext } from 'astro';
// import sgMail from '@sendgrid/mail';

// export const POST: APIRoute = async ({ request, locals }: APIContext) => {
//   const data = await request.formData();
//   const name = data.get("usrname")?.toString();
//   const email = data.get("email")?.toString();
//   const message = data.get("msg")?.toString();
//   const refer = data.get("ref")?.toString() || "Website Form";

//   if (!locals || !locals.runtime || !locals.runtime.env) {
//     return new Response(JSON.stringify({ error: 'Runtime not configured' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' }
//     });
//   }

//   const { DB, SENDGRID_API_KEY } = locals.runtime.env;

//   if (!name || !email || !message) {
//     return new Response(JSON.stringify({ error: 'Missing required fields' }), {
//       status: 400,
//       headers: { 'Content-Type': 'application/json' }
//     });
//   }

//   // Save to D1 Database
//   if (DB) {
//     const query = `
//       INSERT INTO leads (name, email, refer, message, timestamp)
//       VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
//     `;
//     await DB.prepare(query).bind(name, email, refer, message).run();
//   }

//   // Send email via SendGrid
//   if (SENDGRID_API_KEY) {
//     sgMail.setApiKey(SENDGRID_API_KEY);

//     const msg = {
//       to: 'your-email@gmail.com', // Replace with your Gmail
//       from: 'no-reply@yourdomain.com', // Must be verified in SendGrid
//       subject: `New Contact Form Submission from ${name}`,
//       text: `
//         Name: ${name}
//         Email: ${email}
//         Refer: ${refer}
//         Message: ${message}
//       `,
//       html: `
//         <p><strong>Name:</strong> ${name}</p>
//         <p><strong>Email:</strong> ${email}</p>
//         <p><strong>Refer:</strong> ${refer}</p>
//         <p><strong>Message:</strong><br/>${message}</p>
//       `,
//     };

//     try {
//       await sgMail.send(msg);
//     } catch (error: any) {
//       console.error('SendGrid Error:', error);
//       return new Response(JSON.stringify({ error: 'Failed to send email' }), {
//         status: 500,
//         headers: { 'Content-Type': 'application/json' }
//       });
//     }
//   }

//   return new Response(JSON.stringify({ message: 'Submitted successfully' }), {
//     status: 200,
//     headers: { 'Content-Type': 'application/json' }
//   });
// };
