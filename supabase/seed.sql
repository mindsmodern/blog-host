-- !!!                                                                                           !!!
-- !!!            DO NOT EVER ACCIDENTALLY RUN THIS FILE IN YOUR PRODUCTION DATABASE             !!!
-- !!!    this is meant for running locally to seed your database for contributing purposes      !!!

-- create local users (insiders)
-- insiders@grida.co / password
INSERT INTO auth.users ( instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) 
VALUES 
  ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'modernpromenader@gmail.com', crypt('password', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', '');


-- test user email identity
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), (SELECT id FROM auth.users WHERE email = 'modernpromenader@gmail.com'), format('{"sub":"%s","email":"%s"}', (SELECT id FROM auth.users WHERE email = 'modernpromenader@gmail.com')::text, 'modernpromenader@gmail.com')::jsonb, 'email', uuid_generate_v4(), current_timestamp, current_timestamp, current_timestamp);


-- Create domain for test user
INSERT INTO domains (domain_name, owner_id, title, description)
VALUES (
  'modernpromenader',
  (SELECT id FROM auth.users WHERE email = 'modernpromenader@gmail.com'),
  'Modern Promenader Blog',
  'A test blog for Modern Promenader'
);

-- Create posts for mock documents
INSERT INTO posts (domain_id, title, slug)
VALUES 
  ((SELECT id FROM domains WHERE domain_name = 'modernpromenader'), 'Simple Document Example', '/simple'),
  ((SELECT id FROM domains WHERE domain_name = 'modernpromenader'), 'Formatted Text Example', '/formatted'),
  ((SELECT id FROM domains WHERE domain_name = 'modernpromenader'), 'Split Layout Example', '/split'),
  ((SELECT id FROM domains WHERE domain_name = 'modernpromenader'), 'Complex Layout Example', '/complex'),
  ((SELECT id FROM domains WHERE domain_name = 'modernpromenader'), 'Multi-Split Layout Example', '/multisplit'),
  ((SELECT id FROM domains WHERE domain_name = 'modernpromenader'), 'Empty Document Example', '/empty');

-- Mock document data generated from mock-documents.js

-- Insert simple document
INSERT INTO documents (id, post_id, tag, content, width, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM posts WHERE slug = '/simple'),
  'default',
  '{"type":"doc","content":[{"type":"container","content":[{"type":"cell","attrs":{"color":"foreground","width":"thicker","background":"background","padding":"normal","height":null},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"This is a simple paragraph with some text."}]},{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"Here is another paragraph with more content."}]}]}]}]}]}'::jsonb,
  16,
  NOW(),
  NOW()
);

-- Insert formatted document
INSERT INTO documents (id, post_id, tag, content, width, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM posts WHERE slug = '/formatted'),
  'default',
  '{"type":"doc","content":[{"type":"container","content":[{"type":"cell","attrs":{"color":"foreground","width":"thicker","background":"background","padding":"normal","height":null},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"This paragraph has "},{"type":"text","marks":[{"type":"strong"}],"text":"bold text"},{"type":"text","text":" and "},{"type":"text","marks":[{"type":"em"}],"text":"italic text"},{"type":"text","text":"."}]},{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"Another paragraph with a "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://example.com","title":null}}],"text":"link"},{"type":"text","text":" in it."}]}]}]}]}]}'::jsonb,
  16,
  NOW(),
  NOW()
);

-- Insert split document
INSERT INTO documents (id, post_id, tag, content, width, created_at, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  (SELECT id FROM posts WHERE slug = '/split'),
  'default',
  '{"type":"container","content":[{"type":"split","attrs":{"color":"foreground","width":"thicker","span":0.6},"content":[{"type":"container","content":[{"type":"cell","attrs":{"color":"foreground","width":"thicker","background":"primary","padding":"compact","height":null},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"This is the left side of the split."}]},{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"It takes up 60% of the width."}]}]}]}]},{"type":"container","content":[{"type":"cell","attrs":{"color":"foreground","width":"thicker","background":"secondary","padding":"compact","height":null},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"This is the left side of the split."}]},{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"It takes up 60% of the width."}]}]}]}]}]}]}'::jsonb,
  32,
  NOW(),
  NOW()
);

-- Insert complex document
INSERT INTO documents (id, post_id, tag, content, width, created_at, updated_at)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  (SELECT id FROM posts WHERE slug = '/complex'),
  'default',
  '{"type":"doc","content":[{"type":"container","content":[{"type":"cell","attrs":{"color":"background","width":"thicker","background":"primary","padding":"normal","height":null},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Document Header"}]}]}]},{"type":"split","attrs":{"color":"foreground","width":"thicker","span":0.7},"content":[{"type":"container","content":[{"type":"cell","attrs":{"color":"foreground","width":"thicker","background":"background","padding":"normal","height":null},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"Main Content Area"}]},{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"This is where the primary content would go. "},{"type":"text","marks":[{"type":"em"}],"text":"It might contain "},{"type":"text","marks":[{"type":"em"},{"type":"strong"}],"text":"formatted text"},{"type":"text","text":" and other elements."}]}]}]},{"type":"split","attrs":{"color":"foreground","width":"thicker","span":0.5},"content":[{"type":"container","content":[{"type":"cell","attrs":{"color":"background","width":"thicker","background":"tertiary","padding":"condensed","height":null},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"Sub-content A"}]}]}]}]},{"type":"container","content":[{"type":"cell","attrs":{"color":"primary","width":"thicker","background":"secondary","padding":"spacious","height":null},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"Sub-content B"}]}]}]}]}]}]},{"type":"container","content":[{"type":"cell","attrs":{"color":"foreground","width":"thicker","background":"background","padding":"normal","height":null},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Sidebar"}]},{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"This is a sidebar with additional information."}]}]}]},{"type":"cell","attrs":{"color":"foreground","width":"thicker","background":"background","padding":"normal","height":10},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"Another Widget"}]},{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"More sidebar content here."}]}]}]}]}]},{"type":"cell","attrs":{"color":"foreground","width":"thicker","background":"background","padding":"normal","height":null},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"Document Footer - "},{"type":"text","marks":[{"type":"link","attrs":{"href":"mailto:contact@example.com","title":null}}],"text":"Contact us"}]}]}]}]}]}'::jsonb,
  60,
  NOW(),
  NOW()
);

-- Insert multisplit document
INSERT INTO documents (id, post_id, tag, content, width, created_at, updated_at)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  (SELECT id FROM posts WHERE slug = '/multisplit'),
  'default',
  '{"type":"doc","content":[{"type":"container","content":[{"type":"split","attrs":{"color":"foreground","width":"thicker","span":0.33},"content":[{"type":"container","content":[{"type":"cell","attrs":{"color":"background","width":"thicker","background":"primary","padding":"normal","height":null},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Column 1"}]},{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"First column content."}]}]}]}]},{"type":"container","content":[{"type":"split","attrs":{"color":"foreground","width":"thicker","span":0.5},"content":[{"type":"container","content":[{"type":"cell","attrs":{"color":"background","width":"thicker","background":"background","padding":"normal","height":null},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Column 2"}]},{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"Second column with embedded content:"}]}]}]},{"type":"cell","attrs":{"color":"foreground","width":"thicker","background":"background","padding":"normal","height":null},"content":[{"type":"window","attrs":{"url":"33333333-3333-3333-3333-333333333333","title":"Embedded Simple Document"}}]}]},{"type":"container","content":[{"type":"cell","attrs":{"color":"background","width":"thicker","background":"background","padding":"normal","height":null},"content":[{"type":"textblock","content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Column 3"}]},{"type":"paragraph","attrs":{"align":"left","size":"medium"},"content":[{"type":"text","text":"Third column content."}]}]}]}]}]}]}]}]}]}'::jsonb,
  60,
  NOW(),
  NOW()
);

-- Insert empty document
INSERT INTO documents (id, post_id, tag, content, width, created_at, updated_at)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  (SELECT id FROM posts WHERE slug = '/empty'),
  'default',
  '{"type":"doc","content":[{"type":"container","content":[{"type":"cell","attrs":{"color":"foreground","width":"thicker","background":"background","padding":"normal","height":null},"content":[{"type":"paragraph","attrs":{"align":"left","size":"medium"}}]}]}]}'::jsonb,
  16,
  NOW(),
  NOW()
);
