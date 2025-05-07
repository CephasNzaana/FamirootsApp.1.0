# FamiRoots: Preserving Ugandan Heritage

FamiRoots is an AI-powered genealogical platform crafted to preserve and explore Uganda's rich family heritage through advanced technology. It enables users to build, visualize, and explore their family trees while maintaining cultural authenticity and reflecting Uganda's tribal heritage.

## 🌟 Key Features

- **Interactive Family Tree Builder**: Automatically create and visualize family relationships with an intuitive interface.
- **AI-Powered Insights**: Generate family stories, analyze relationship patterns, and receive personalized suggestions.
- **Cultural Heritage Integration**: Connect family histories to Ugandan tribal and clan traditions, including verified elders.
- **Elder Verification System**: Allow experts to verify elders and maintain an accurate database for genealogical tracing.
- **Relationship Analyzer**: Analyze and determine relationships between individuals based on shared elder connections.
- **Elder Edits/Corrections**: Submit elder information corrections, which experts can review and approve.
- **Privacy Controls**: Approve connection requests before sharing full details or connecting via a private chat.
- **Family Tree Expansion**: Automatically expand user family trees over time as new connections are discovered.
- **Tribes and Clans Directory**: Explore tribes and clans, with verified elders and family trees displayed by family name (e.g., "Bagorogoza Family").
- **Rich Cultural Resources**: Access traditional knowledge, customs, and practices tied to families, clans, and tribes.

## 🔧 Technology Stack

- **Frontend**: React with TypeScript
- **Backend**: Supabase with PostgreSQL and Drizzle ORM
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **AI Integration**: OpenAI API for relationship discovery and story generation
- **Authentication**: Supabase Auth
- **Real-time Updates**: Automated deployment via Netlify

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL database (Supabase)
- OpenAI API key 

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/famiroots.git
   cd famiroots
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with:
   ```
   DATABASE_URL=supabaseurl://username:password
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Initialize the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## 🧠 AI Features

FamiRoots leverages AI to enhance the family history and relationship discovery process:

- **Name and Relationship Analysis**: Automatically identify relationships and cultural significance of names.
- **Story Generation**: Create rich narratives using minimal family data.
- **Family Tree Generator**: Build and expand family trees based on verified elder connections.
- **Elder-Based Relationship Mapping**: Suggest connections limited to verified elders and their families.
- **Cultural Patterns and Traditions**: Analyze and link generations through traditions and customs.
- **Lineage Verification**: Identify inconsistencies and suggest corrections.

## 📚 Data Model

The application's core entities include:

- **Users**: Manage user accounts, including general users, experts, and admins.
- **Verified Elders**: Records of verified elders maintained by genealogy experts.
- **Family Members**: Individual records with relationships and metadata.
- **Tribes and Clans**: Uganda's ethnic groups and sub-divisions with historical and cultural information.
- **Families**: Family trees displayed by family name (e.g., "Bagorogoza Family").
- **Cultural Resources**: Traditions, customs, and heritage tied to tribes and clans.

## 🔒 Privacy and Safety

FamiRoots prioritizes privacy and user safety:
- Only limited details are displayed for suggested connections until users approve requests.
- Connections can be blocked or reported for inappropriate behavior.
- Approved connections enable private chat for meaningful interactions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the Creative Commons License - see the LICENSE file for details.

## 📞 Contact

For inquiries, reach us at **info@famiroots.com**. Follow us on social media @famiroots for updates.  
(No phone number or address is currently available.)

## 🙏 Acknowledgements

- Uganda National Cultural Centre for tribal heritage consultation.
- Tribal elder councils for their guidance on customs and traditions.
- All contributors who have participated in the development of this project.
